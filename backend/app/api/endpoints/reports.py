"""Monthly ROI report (#33) — anti-churn core.

Aggregates conversations + confirmed bookings for one hotel within a
calendar month, then divides saved revenue by the hotel's subscription
fee to produce the ROI multiplier the owner reads on the 1st of next month.
"""
from __future__ import annotations

import calendar
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.database import get_db
from ...db.models import ConfirmedBooking, Conversation, Hotel, User
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])


class MonthlyROIReport(BaseModel):
    hotel_id: int
    hotel_name: str
    month: str  # "2026-04"
    total_dialogs: int
    booking_dialogs: int
    confirmed_bookings: int
    saved_revenue_usd: float
    avg_booking_price_usd: float
    subscription_fee_usd: float
    roi_x: float  # multiplier; e.g. 117.0 means 117× return on the $40/mo fee


def _parse_month(month: str) -> tuple[datetime, datetime]:
    """Parse 'YYYY-MM' into (start_inclusive, end_exclusive) UTC datetimes."""
    try:
        year, mon = map(int, month.split("-", 1))
        start = datetime(year, mon, 1, tzinfo=timezone.utc)
        last_day = calendar.monthrange(year, mon)[1]
        end = datetime(year, mon, last_day, 23, 59, 59, 999_999, tzinfo=timezone.utc)
        return start, end
    except (ValueError, IndexError) as exc:
        raise HTTPException(status_code=422, detail="month must be YYYY-MM") from exc


async def _assert_hotel_access(db: AsyncSession, user: User, hotel_id: int) -> Hotel:
    """Same chokepoint pattern as conversations.py — collapse 404/403."""
    hotel = (await db.execute(select(Hotel).where(Hotel.id == hotel_id))).scalar_one_or_none()
    if hotel is None:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if user.role != "admin" and hotel.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return hotel


@router.get("/monthly", response_model=MonthlyROIReport)
async def monthly_roi_report(
    hotel_id: int = Query(...),
    month: Optional[str] = Query(None, description="YYYY-MM, defaults to current"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Anti-churn ROI summary for one hotel within one month.

    saved_revenue_usd = SUM(amount_usd) over confirmed_bookings in the month.
    Empty-month → roi_x = 0. Subscription fee = 0 → roi_x = 0 (divide-by-zero
    guard).
    """
    if month is None:
        now = datetime.utcnow()
        month = f"{now.year:04d}-{now.month:02d}"
    start, end = _parse_month(month)

    hotel = await _assert_hotel_access(db, user, hotel_id)

    # Total dialogs that had activity in the month — includes carry-overs from
    # March that received an April message.
    total_dialogs = (await db.execute(
        select(func.count(Conversation.id))
        .where(and_(
            Conversation.hotel_id == hotel.id,
            Conversation.last_message_at.between(start, end),
        ))
    )).scalar() or 0

    booking_dialogs = (await db.execute(
        select(func.count(Conversation.id))
        .where(and_(
            Conversation.hotel_id == hotel.id,
            Conversation.last_message_at.between(start, end),
            Conversation.category == "booking",
        ))
    )).scalar() or 0

    bookings = (await db.execute(
        select(ConfirmedBooking)
        .where(and_(
            ConfirmedBooking.hotel_id == hotel.id,
            ConfirmedBooking.confirmed_at.between(start, end),
        ))
    )).scalars().all()

    confirmed_count = len(bookings)
    saved_revenue = round(sum((b.amount_usd or 0.0) for b in bookings), 2)
    sub_fee = float(hotel.sub_fee_usd or 0)
    roi_x = round(saved_revenue / sub_fee, 1) if sub_fee > 0 else 0.0

    return MonthlyROIReport(
        hotel_id=hotel.id,
        hotel_name=hotel.name,
        month=month,
        total_dialogs=int(total_dialogs),
        booking_dialogs=int(booking_dialogs),
        confirmed_bookings=confirmed_count,
        saved_revenue_usd=saved_revenue,
        avg_booking_price_usd=float(hotel.avg_booking_price_usd or 0),
        subscription_fee_usd=sub_fee,
        roi_x=roi_x,
    )
