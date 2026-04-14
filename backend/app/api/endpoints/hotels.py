from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List
from datetime import datetime
from ...db.database import get_db
from ...db.models import User, Hotel, Conversation, Message, AIUsage
from ..dependencies import get_current_user
from ..schemas import HotelCreate, HotelUpdate, Hotel as HotelSchema, HotelList, HotelStatsResponse
from ...services.telegram_service import TelegramService
from ...services.ai_service import ai_service
from ...core.config import settings
import re

router = APIRouter(prefix="/hotels", tags=["hotels"])

# Cyrillic to Latin transliteration map
_TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'ө': 'o', 'ү': 'u', 'ң': 'ng',  # Kyrgyz letters
}


def create_slug(name: str) -> str:
    """Create URL-friendly slug from hotel name with Cyrillic transliteration."""
    slug = name.lower()
    slug = ''.join(_TRANSLIT.get(ch, ch) for ch in slug)
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s]+', '-', slug)
    slug = slug.strip('-')
    return slug or 'hotel'


@router.post("", response_model=HotelSchema, status_code=status.HTTP_201_CREATED)
async def create_hotel(
    hotel_data: HotelCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Create slug
    slug = create_slug(hotel_data.name)

    # Check if slug is unique
    result = await db.execute(select(Hotel).where(Hotel.slug == slug))
    existing = result.scalar_one_or_none()

    if existing:
        counter = 1
        while existing:
            new_slug = f"{slug}-{counter}"
            result = await db.execute(select(Hotel).where(Hotel.slug == new_slug))
            existing = result.scalar_one_or_none()
            counter += 1
        slug = new_slug

    # Auto-generate system prompt if not provided
    system_prompt = hotel_data.system_prompt
    if not system_prompt:
        hotel_dict = {
            "name": hotel_data.name,
            "description": hotel_data.description,
            "address": hotel_data.address,
            "phone": hotel_data.phone,
            "email": hotel_data.email,
            "website": hotel_data.website,
            "rooms": [r.model_dump() for r in hotel_data.rooms] if hotel_data.rooms else [],
            "rules": hotel_data.rules.model_dump() if hotel_data.rules else {},
            "amenities": hotel_data.amenities.model_dump() if hotel_data.amenities else {},
            "communication_style": hotel_data.communication_style,
        }
        system_prompt = await ai_service.generate_system_prompt(hotel_dict)

    # Determine initial status
    has_channel = bool(hotel_data.telegram_bot_token or hotel_data.whatsapp_phone)
    initial_status = "active" if has_channel else "demo"

    # Create hotel
    new_hotel = Hotel(
        owner_id=current_user.id,
        name=hotel_data.name,
        slug=slug,
        address=hotel_data.address,
        phone=hotel_data.phone,
        email=hotel_data.email,
        website=hotel_data.website,
        description=hotel_data.description,
        telegram_bot_token=hotel_data.telegram_bot_token,
        whatsapp_phone=hotel_data.whatsapp_phone,
        ai_model=hotel_data.ai_model,
        system_prompt=system_prompt,
        rooms=[room.model_dump() for room in hotel_data.rooms] if hotel_data.rooms else [],
        rules=hotel_data.rules.model_dump() if hotel_data.rules else {},
        amenities=hotel_data.amenities.model_dump() if hotel_data.amenities else {},
        communication_style=hotel_data.communication_style,
        languages=hotel_data.languages,
        monthly_budget=hotel_data.monthly_budget,
        status=initial_status,
    )

    db.add(new_hotel)
    await db.commit()
    await db.refresh(new_hotel)

    # Register Telegram webhook only if token provided
    if hotel_data.telegram_bot_token and settings.WEBHOOK_BASE_URL:
        try:
            is_valid = await TelegramService.validate_bot_token(hotel_data.telegram_bot_token)
            if is_valid:
                telegram = TelegramService(hotel_data.telegram_bot_token)
                webhook_url = f"{settings.WEBHOOK_BASE_URL}/webhooks/telegram/{slug}"
                await telegram.set_webhook(webhook_url)
        except Exception as e:
            print(f"Webhook registration error: {e}")

    return new_hotel


@router.get("", response_model=List[HotelList])
async def get_hotels(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Hotel).where(Hotel.owner_id == current_user.id).order_by(Hotel.created_at.desc())
    )
    hotels = result.scalars().all()
    return hotels


@router.get("/{hotel_id}", response_model=HotelSchema)
async def get_hotel(
    hotel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Hotel).where(Hotel.id == hotel_id))
    hotel = result.scalar_one_or_none()

    if not hotel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")
    if hotel.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    return hotel


@router.put("/{hotel_id}", response_model=HotelSchema)
async def update_hotel(
    hotel_id: int,
    hotel_data: HotelUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Hotel).where(Hotel.id == hotel_id))
    hotel = result.scalar_one_or_none()

    if not hotel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")
    if hotel.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    update_data = hotel_data.model_dump(exclude_unset=True)

    if 'rooms' in update_data and update_data['rooms']:
        update_data['rooms'] = [room.model_dump() if hasattr(room, 'model_dump') else room for room in update_data['rooms']]
    if 'rules' in update_data and update_data['rules']:
        update_data['rules'] = update_data['rules'].model_dump() if hasattr(update_data['rules'], 'model_dump') else update_data['rules']
    if 'amenities' in update_data and update_data['amenities']:
        update_data['amenities'] = update_data['amenities'].model_dump() if hasattr(update_data['amenities'], 'model_dump') else update_data['amenities']

    for field, value in update_data.items():
        setattr(hotel, field, value)

    await db.commit()
    await db.refresh(hotel)
    return hotel


@router.post("/{hotel_id}/configure-channels", response_model=HotelSchema)
async def configure_channels(
    hotel_id: int,
    channel_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Configure Telegram/WhatsApp channels for an existing hotel.
    Called by admin after hotel is created via questionnaire.
    """
    result = await db.execute(select(Hotel).where(Hotel.id == hotel_id))
    hotel = result.scalar_one_or_none()

    if not hotel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")
    if hotel.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    telegram_token = channel_data.get("telegram_bot_token")
    whatsapp_phone = channel_data.get("whatsapp_phone")

    # Configure Telegram
    if telegram_token:
        is_valid = await TelegramService.validate_bot_token(telegram_token)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Telegram bot token"
            )
        hotel.telegram_bot_token = telegram_token

        # Register webhook
        if settings.WEBHOOK_BASE_URL:
            telegram = TelegramService(telegram_token)
            webhook_url = f"{settings.WEBHOOK_BASE_URL}/webhooks/telegram/{hotel.slug}"
            await telegram.set_webhook(webhook_url)

    # Configure WhatsApp
    if whatsapp_phone:
        hotel.whatsapp_phone = whatsapp_phone

    # Activate hotel if at least one channel configured
    if hotel.telegram_bot_token or hotel.whatsapp_phone:
        hotel.status = "active"

    await db.commit()
    await db.refresh(hotel)
    return hotel


@router.get("/{hotel_id}/stats", response_model=HotelStatsResponse)
async def get_hotel_stats(
    hotel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get hotel statistics."""
    result = await db.execute(select(Hotel).where(Hotel.id == hotel_id))
    hotel = result.scalar_one_or_none()

    if not hotel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")
    if hotel.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    msg_result = await db.execute(
        select(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(Conversation.hotel_id == hotel_id)
    )
    messages_total = msg_result.scalar() or 0

    conv_total_result = await db.execute(
        select(func.count(Conversation.id)).where(Conversation.hotel_id == hotel_id)
    )
    conversations_total = conv_total_result.scalar() or 0

    conv_month_result = await db.execute(
        select(func.count(Conversation.id)).where(
            and_(Conversation.hotel_id == hotel_id, Conversation.created_at >= month_start)
        )
    )
    conversations_month = conv_month_result.scalar() or 0

    handled_result = await db.execute(
        select(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(
            and_(
                Conversation.hotel_id == hotel_id,
                Message.role == "assistant",
                Message.created_at >= month_start,
            )
        )
    )
    requests_handled = handled_result.scalar() or 0

    completed_result = await db.execute(
        select(func.count(Conversation.id)).where(
            and_(Conversation.hotel_id == hotel_id, Conversation.status == "completed")
        )
    )
    completed = completed_result.scalar() or 0

    needs_operator_result = await db.execute(
        select(func.count(Conversation.id)).where(
            and_(Conversation.hotel_id == hotel_id, Conversation.status == "needs_operator")
        )
    )
    needs_operator = needs_operator_result.scalar() or 0

    total_resolved = completed + needs_operator
    automation_rate = int((completed / total_resolved * 100)) if total_resolved > 0 else 0

    return HotelStatsResponse(
        messages_total=messages_total,
        conversations_total=conversations_total,
        conversations_month=conversations_month,
        requests_handled=requests_handled,
        automation_rate=automation_rate,
    )


@router.delete("/{hotel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hotel(
    hotel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Hotel).where(Hotel.id == hotel_id))
    hotel = result.scalar_one_or_none()

    if not hotel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")
    if hotel.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    await db.delete(hotel)
    await db.commit()
