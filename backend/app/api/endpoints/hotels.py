from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ...db.database import get_db
from ...db.models import User, Hotel
from ..dependencies import get_current_user
from ..schemas import HotelCreate, HotelUpdate, Hotel as HotelSchema, HotelList
import re

router = APIRouter(prefix="/hotels", tags=["hotels"])


def create_slug(name: str) -> str:
    """Create URL-friendly slug from hotel name"""
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s]+', '-', slug)
    return slug


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
        # Add number suffix
        counter = 1
        while existing:
            new_slug = f"{slug}-{counter}"
            result = await db.execute(select(Hotel).where(Hotel.slug == new_slug))
            existing = result.scalar_one_or_none()
            counter += 1
        slug = new_slug

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
        system_prompt=hotel_data.system_prompt,
        rooms=[room.model_dump() for room in hotel_data.rooms] if hotel_data.rooms else [],
        rules=hotel_data.rules.model_dump() if hotel_data.rules else {},
        amenities=hotel_data.amenities.model_dump() if hotel_data.amenities else {},
        communication_style=hotel_data.communication_style,
        languages=hotel_data.languages,
    )

    db.add(new_hotel)
    await db.commit()
    await db.refresh(new_hotel)

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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel not found"
        )

    if hotel.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this hotel"
        )

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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel not found"
        )

    if hotel.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this hotel"
        )

    # Update fields
    update_data = hotel_data.model_dump(exclude_unset=True)

    # Convert Pydantic models to dicts
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


@router.delete("/{hotel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hotel(
    hotel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Hotel).where(Hotel.id == hotel_id))
    hotel = result.scalar_one_or_none()

    if not hotel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel not found"
        )

    if hotel.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this hotel"
        )

    await db.delete(hotel)
    await db.commit()
