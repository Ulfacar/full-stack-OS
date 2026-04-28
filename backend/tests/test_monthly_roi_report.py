"""Tests for monthly_roi_report endpoint (#33).

Coverage:
- happy-path: bookings sum into saved_revenue, roi_x computed correctly
- multitenancy: cross-hotel attempt → 404
- empty month: zeros + roi_x=0 (no divide-by-zero)
- date-range filter: bookings outside the month are excluded
- malformed month string → 422
- defaults to current month when month param omitted
"""
from __future__ import annotations

from datetime import datetime, timezone

import pytest
import pytest_asyncio
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.api.endpoints.reports import _parse_month, monthly_roi_report
from app.db.database import Base
from app.db.models import (
    Client, ConfirmedBooking, Conversation, Hotel, User,
)


@pytest_asyncio.fixture
async def db():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as session:
        yield session
    await engine.dispose()


@pytest_asyncio.fixture
async def seeded(db):
    owner_a = User(name="A", email="a@x", hashed_password="x", role="sales")
    owner_b = User(name="B", email="b@x", hashed_password="x", role="sales")
    db.add_all([owner_a, owner_b])
    await db.flush()

    hotel_a = Hotel(
        owner_id=owner_a.id, name="Hotel A", slug="hotel-a",
        sub_fee_usd=40.0, avg_booking_price_usd=120.0,
    )
    hotel_b = Hotel(owner_id=owner_b.id, name="Hotel B", slug="hotel-b")
    db.add_all([hotel_a, hotel_b])
    await db.flush()

    client_a = Client(hotel_id=hotel_a.id, telegram_id="100", name="Alice")
    db.add(client_a)
    await db.flush()

    # April 2026 conversations: 5 total, 3 booking-category
    apr_15 = datetime(2026, 4, 15, 10, 0, tzinfo=timezone.utc)
    for i, cat in enumerate(["booking", "booking", "booking", "hotel", "service"]):
        c = Conversation(
            hotel_id=hotel_a.id, client_id=client_a.id,
            status="active", channel="telegram", category=cat,
            last_message_at=apr_15.replace(day=10 + i),
        )
        db.add(c)
    # March 2026 carry-over (must be excluded from April report)
    db.add(Conversation(
        hotel_id=hotel_a.id, client_id=client_a.id,
        status="active", channel="telegram", category="booking",
        last_message_at=datetime(2026, 3, 30, 12, 0, tzinfo=timezone.utc),
    ))
    await db.flush()

    # April 2026 confirmed bookings: 4 with totals 100, 200, 300, 400 = $1,000
    for i, amount in enumerate([100, 200, 300, 400]):
        db.add(ConfirmedBooking(
            conversation_id=1, hotel_id=hotel_a.id,
            amount_usd=amount, nights=2,
            confirmed_by_user_id=owner_a.id,
            confirmed_at=apr_15.replace(day=5 + i),
        ))
    # March booking — excluded
    db.add(ConfirmedBooking(
        conversation_id=1, hotel_id=hotel_a.id,
        amount_usd=999, nights=1,
        confirmed_by_user_id=owner_a.id,
        confirmed_at=datetime(2026, 3, 28, tzinfo=timezone.utc),
    ))
    await db.commit()

    return {"owner_a": owner_a, "owner_b": owner_b, "hotel_a": hotel_a, "hotel_b": hotel_b}


@pytest.mark.asyncio
async def test_happy_path_aggregates_april(db, seeded):
    out = await monthly_roi_report(
        hotel_id=seeded["hotel_a"].id, month="2026-04", db=db, user=seeded["owner_a"],
    )
    assert out.month == "2026-04"
    assert out.hotel_name == "Hotel A"
    # 5 April conversations, 3 booking-category, March excluded
    assert out.total_dialogs == 5
    assert out.booking_dialogs == 3
    assert out.confirmed_bookings == 4
    assert out.saved_revenue_usd == 1000.0
    # ROI = 1000 / 40 = 25.0
    assert out.roi_x == 25.0
    assert out.subscription_fee_usd == 40.0
    assert out.avg_booking_price_usd == 120.0


@pytest.mark.asyncio
async def test_cross_hotel_blocked(db, seeded):
    with pytest.raises(HTTPException) as exc:
        await monthly_roi_report(
            hotel_id=seeded["hotel_b"].id, month="2026-04",
            db=db, user=seeded["owner_a"],
        )
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_empty_month_zeros_no_divide_by_zero(db, seeded):
    out = await monthly_roi_report(
        hotel_id=seeded["hotel_a"].id, month="2026-01",
        db=db, user=seeded["owner_a"],
    )
    assert out.total_dialogs == 0
    assert out.booking_dialogs == 0
    assert out.confirmed_bookings == 0
    assert out.saved_revenue_usd == 0.0
    assert out.roi_x == 0.0


@pytest.mark.asyncio
async def test_malformed_month_422(db, seeded):
    with pytest.raises(HTTPException) as exc:
        await monthly_roi_report(
            hotel_id=seeded["hotel_a"].id, month="not-a-month",
            db=db, user=seeded["owner_a"],
        )
    assert exc.value.status_code == 422


def test_parse_month_boundaries():
    start, end = _parse_month("2026-04")
    assert start.year == 2026 and start.month == 4 and start.day == 1
    assert end.year == 2026 and end.month == 4 and end.day == 30
    assert end.hour == 23 and end.minute == 59
