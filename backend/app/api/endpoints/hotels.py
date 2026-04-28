from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List
from datetime import datetime, timedelta
from ...db.database import get_db
from ...db.models import User, Hotel, Conversation, Message, AIUsage, PromptHistory
from ..dependencies import get_current_user
from ..schemas import HotelCreate, HotelUpdate, Hotel as HotelSchema, HotelList, HotelStatsResponse, ChannelBreakdown, DailyConversations
from ...services.telegram_service import TelegramService
from ...services.ai_service import ai_service
from ...core.config import settings
from ...core.crypto import encrypt_token, decrypt_token
import re
import secrets

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

    # Normalise payment_details: drop empty dict so NULL in DB triggers the
    # fail-loud safeguard, keep truthy subsets as-is.
    payment_details_dict = hotel_data.payment_details.model_dump() if hotel_data.payment_details else None
    if payment_details_dict and not any((payment_details_dict.get(k) or "") for k in ("bank_details", "phone_for_payment", "iban", "notes")):
        payment_details_dict = None

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
            "payment_details": payment_details_dict,
            "communication_style": hotel_data.communication_style,
            "pms_kind": hotel_data.pms_kind,
        }
        system_prompt = await ai_service.generate_system_prompt(hotel_dict)

    # Determine initial status
    has_channel = bool(hotel_data.telegram_bot_token or hotel_data.whatsapp_phone)
    initial_status = "active" if has_channel else "demo"

    # Generate webhook secret for this hotel
    webhook_secret = secrets.token_hex(32)

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
        telegram_bot_token=encrypt_token(hotel_data.telegram_bot_token) if hotel_data.telegram_bot_token else None,
        whatsapp_phone=hotel_data.whatsapp_phone,
        ai_model=hotel_data.ai_model,
        system_prompt=system_prompt,
        rooms=[room.model_dump() for room in hotel_data.rooms] if hotel_data.rooms else [],
        rules=hotel_data.rules.model_dump() if hotel_data.rules else {},
        amenities=hotel_data.amenities.model_dump() if hotel_data.amenities else {},
        payment_details=payment_details_dict,
        communication_style=hotel_data.communication_style,
        languages=hotel_data.languages,
        monthly_budget=hotel_data.monthly_budget,
        status=initial_status,
        webhook_secret=webhook_secret,
        pms_kind=hotel_data.pms_kind or "none",
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
                await telegram.set_webhook(webhook_url, secret_token=webhook_secret)
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
    whatsapp_provider = channel_data.get("whatsapp_provider")
    wappi_api_key = channel_data.get("wappi_api_key")
    wappi_profile_id = channel_data.get("wappi_profile_id")
    meta_access_token = channel_data.get("meta_access_token")
    meta_phone_number_id = channel_data.get("meta_phone_number_id")
    meta_business_id = channel_data.get("meta_business_id")
    manager_telegram_id = channel_data.get("manager_telegram_id")
    manager_name = channel_data.get("manager_name")

    # Generate webhook secret if not exists
    if not hotel.webhook_secret:
        hotel.webhook_secret = secrets.token_hex(32)

    # Configure Telegram
    if telegram_token:
        is_valid = await TelegramService.validate_bot_token(telegram_token)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Telegram bot token"
            )
        hotel.telegram_bot_token = encrypt_token(telegram_token)

        # Register webhook (use plaintext token for Telegram API)
        if settings.WEBHOOK_BASE_URL:
            telegram = TelegramService(telegram_token)
            webhook_url = f"{settings.WEBHOOK_BASE_URL}/webhooks/telegram/{hotel.slug}"
            await telegram.set_webhook(webhook_url, secret_token=hotel.webhook_secret)

    # Configure WhatsApp (wappi.pro)
    if whatsapp_phone:
        hotel.whatsapp_phone = whatsapp_phone
    if wappi_api_key:
        hotel.wappi_api_key = encrypt_token(wappi_api_key)
    if wappi_profile_id:
        hotel.wappi_profile_id = wappi_profile_id

    # Configure Meta WhatsApp
    if whatsapp_provider:
        hotel.whatsapp_provider = whatsapp_provider
    if meta_access_token:
        hotel.meta_access_token = encrypt_token(meta_access_token)
    if meta_phone_number_id:
        hotel.meta_phone_number_id = meta_phone_number_id
    if meta_business_id:
        hotel.meta_business_id = meta_business_id

    # Configure manager
    if manager_telegram_id:
        hotel.manager_telegram_id = manager_telegram_id
    if manager_name:
        hotel.manager_name = manager_name

    # Activate hotel if at least one channel configured
    if hotel.telegram_bot_token or (hotel.wappi_api_key and hotel.wappi_profile_id):
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

    # Channel breakdown this month
    tg_result = await db.execute(
        select(func.count(Conversation.id)).where(
            and_(Conversation.hotel_id == hotel_id, Conversation.channel == "telegram", Conversation.created_at >= month_start)
        )
    )
    tg_count = tg_result.scalar() or 0

    wa_result = await db.execute(
        select(func.count(Conversation.id)).where(
            and_(Conversation.hotel_id == hotel_id, Conversation.channel == "whatsapp", Conversation.created_at >= month_start)
        )
    )
    wa_count = wa_result.scalar() or 0

    # Daily conversations (last 30 days)
    thirty_days_ago = now - timedelta(days=30)
    daily_result = await db.execute(
        select(
            func.date(Conversation.created_at).label("date"),
            func.count(Conversation.id).label("count"),
        )
        .where(and_(Conversation.hotel_id == hotel_id, Conversation.created_at >= thirty_days_ago))
        .group_by(func.date(Conversation.created_at))
        .order_by(func.date(Conversation.created_at))
    )
    daily = [DailyConversations(date=str(row.date), count=row.count) for row in daily_result.all()]

    return HotelStatsResponse(
        messages_total=messages_total,
        conversations_total=conversations_total,
        conversations_month=conversations_month,
        requests_handled=requests_handled,
        automation_rate=automation_rate,
        needs_operator_count=needs_operator,
        channels=ChannelBreakdown(telegram=tg_count, whatsapp=wa_count),
        daily=daily,
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


# === STAGING / PROMOTE / ROLLBACK ===

@router.put("/{hotel_id}/staging")
async def update_staging_prompt(
    hotel_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save a staging prompt for testing before promoting to production."""
    result = await db.execute(select(Hotel).where(Hotel.id == hotel_id))
    hotel = result.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if hotel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    hotel.staging_prompt = data.get("staging_prompt", "")
    await db.commit()
    return {"status": "ok", "staging_prompt": hotel.staging_prompt}


@router.post("/{hotel_id}/register-telegram-webhook")
async def register_telegram_webhook(
    hotel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Register the Telegram webhook for this hotel against the configured
    WEBHOOK_BASE_URL. Decrypts the bot token and reuses the per-hotel
    webhook_secret stored in DB so X-Telegram-Bot-Api-Secret-Token verification
    works automatically. Returns Telegram's setWebhook response.
    """
    result = await db.execute(select(Hotel).where(Hotel.id == hotel_id))
    hotel = result.scalar_one_or_none()
    if hotel is None:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if hotel.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=404, detail="Hotel not found")
    if not hotel.telegram_bot_token:
        raise HTTPException(status_code=400, detail="Telegram bot token not configured")
    if not hotel.webhook_secret:
        # Fallback: generate one if missing (legacy hotels created before
        # the secret-token migration).
        hotel.webhook_secret = secrets.token_hex(32)
        await db.flush()
    if not settings.WEBHOOK_BASE_URL:
        raise HTTPException(
            status_code=500,
            detail="WEBHOOK_BASE_URL is not configured on the server",
        )

    raw_token = decrypt_token(hotel.telegram_bot_token)
    webhook_url = f"{settings.WEBHOOK_BASE_URL.rstrip('/')}/webhooks/telegram/{hotel.slug}"
    tg = TelegramService(raw_token)
    response = await tg.set_webhook(webhook_url, secret_token=hotel.webhook_secret)
    if not response.get("ok"):
        raise HTTPException(
            status_code=502,
            detail=f"Telegram setWebhook failed: {response.get('description', response)}",
        )

    await db.commit()
    return {
        "ok": True,
        "webhook_url": webhook_url,
        "telegram_response": response,
    }


@router.post("/{hotel_id}/promote")
async def promote_staging(
    hotel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Promote staging prompt to production. Saves old prompt in history."""
    result = await db.execute(select(Hotel).where(Hotel.id == hotel_id))
    hotel = result.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if hotel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not hotel.staging_prompt:
        raise HTTPException(status_code=400, detail="No staging prompt to promote")

    # Save history
    history = PromptHistory(
        hotel_id=hotel.id,
        old_prompt=hotel.system_prompt,
        new_prompt=hotel.staging_prompt,
        changed_by=current_user.id,
    )
    db.add(history)

    # Promote
    hotel.system_prompt = hotel.staging_prompt
    hotel.staging_prompt = None
    await db.commit()

    return {"status": "promoted", "system_prompt": hotel.system_prompt}


@router.post("/{hotel_id}/rollback")
async def rollback_prompt(
    hotel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Rollback to the previous system prompt from history."""
    result = await db.execute(select(Hotel).where(Hotel.id == hotel_id))
    hotel = result.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if hotel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get last history entry
    hist_result = await db.execute(
        select(PromptHistory)
        .where(PromptHistory.hotel_id == hotel_id)
        .order_by(PromptHistory.changed_at.desc())
        .limit(1)
    )
    last = hist_result.scalar_one_or_none()
    if not last:
        raise HTTPException(status_code=400, detail="No prompt history to rollback")

    # Rollback
    hotel.system_prompt = last.old_prompt
    await db.commit()

    return {"status": "rolled_back", "system_prompt": hotel.system_prompt, "rolled_back_from": last.changed_at.isoformat()}
