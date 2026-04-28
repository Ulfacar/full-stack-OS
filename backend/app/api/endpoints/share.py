"""Partner-share read-only hotel preview (#11).

Owner clicks "Поделиться" in the admin → POST creates a 7-day token →
URL goes to a partner who opens GET (public, no auth) → sanitised hotel
preview is shown and view_count ticks up so the owner knows it landed.
"""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.database import get_db
from ...db.models import Hotel, ShareLink, User
from ..dependencies import get_current_user

router = APIRouter(tags=["share"])

TOKEN_TTL_DAYS = 7
TOKEN_BYTES = 24  # → 48 hex chars, well within String(64)


class ShareLinkOut(BaseModel):
    token: str
    url_path: str  # /share/<token> — frontend prepends host
    expires_at: datetime
    view_count: int

    class Config:
        from_attributes = True


class HotelPublicPreview(BaseModel):
    """Sanitized hotel view — no creds, no payment_details, no manager_telegram_id."""
    name: str
    description: Optional[str]
    address: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    website: Optional[str]
    rooms: list
    amenities: dict
    rules: dict
    languages: List[str]
    communication_style: str

    class Config:
        from_attributes = True


@router.post("/api/hotels/{hotel_id}/share-link", response_model=ShareLinkOut)
async def create_share_link(
    hotel_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Owner-only: generate a 7-day read-only token for partner sharing."""
    hotel = (await db.execute(select(Hotel).where(Hotel.id == hotel_id))).scalar_one_or_none()
    if hotel is None:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if user.role != "admin" and hotel.owner_id != user.id:
        # Hide existence from non-owners (matches conversations.py chokepoint policy)
        raise HTTPException(status_code=404, detail="Hotel not found")

    token = secrets.token_hex(TOKEN_BYTES)
    expires = datetime.utcnow() + timedelta(days=TOKEN_TTL_DAYS)

    link = ShareLink(
        token=token,
        hotel_id=hotel.id,
        created_by_user_id=user.id,
        expires_at=expires,
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)

    return ShareLinkOut(
        token=link.token,
        url_path=f"/share/{link.token}",
        expires_at=link.expires_at,
        view_count=link.view_count,
    )


@router.get("/api/hotels/{hotel_id}/share-links", response_model=list[ShareLinkOut])
async def list_share_links(
    hotel_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Owner-only: see all active links for this hotel + their view_count."""
    hotel = (await db.execute(select(Hotel).where(Hotel.id == hotel_id))).scalar_one_or_none()
    if hotel is None or (user.role != "admin" and hotel.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Hotel not found")

    rows = (await db.execute(
        select(ShareLink)
        .where(ShareLink.hotel_id == hotel.id)
        .order_by(ShareLink.created_at.desc())
    )).scalars().all()
    return [
        ShareLinkOut(
            token=r.token,
            url_path=f"/share/{r.token}",
            expires_at=r.expires_at,
            view_count=r.view_count,
        )
        for r in rows
    ]


@router.get("/api/share/{token}", response_model=HotelPublicPreview)
async def view_share_link(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Public — partner opens this. No auth. Increments view_count."""
    link = (
        await db.execute(select(ShareLink).where(ShareLink.token == token))
    ).scalar_one_or_none()
    if link is None:
        raise HTTPException(status_code=404, detail="Link not found")
    if datetime.utcnow() > link.expires_at:
        raise HTTPException(status_code=410, detail="Link expired")

    hotel = (await db.execute(select(Hotel).where(Hotel.id == link.hotel_id))).scalar_one_or_none()
    if hotel is None:
        raise HTTPException(status_code=404, detail="Hotel not found")

    link.view_count += 1
    await db.commit()

    return HotelPublicPreview(
        name=hotel.name,
        description=hotel.description,
        address=hotel.address,
        phone=hotel.phone,
        email=hotel.email,
        website=hotel.website,
        rooms=hotel.rooms or [],
        amenities=hotel.amenities or {},
        rules=hotel.rules or {},
        languages=hotel.languages or ["ru"],
        communication_style=hotel.communication_style or "friendly",
    )
