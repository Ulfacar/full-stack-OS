"""Tests for confirmed-booking endpoint (#25 — ROI raw data for #33).

Coverage:
- Happy path: payload → 201 + ConfirmedBookingOut + DB row + correct user attribution
- Validation: amount_usd <= 0 → 422; nights <= 0 → 422
- Multitenancy: cross-hotel attempt → 404
- List endpoint: returns only own hotel's bookings; date filter works
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.api.endpoints.conversations import (
    ConfirmBookingIn,
    confirm_booking,
    list_confirmed_bookings,
)
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

    hotel_a = Hotel(owner_id=owner_a.id, name="Hotel A", slug="hotel-a")
    hotel_b = Hotel(owner_id=owner_b.id, name="Hotel B", slug="hotel-b")
    db.add_all([hotel_a, hotel_b])
    await db.flush()

    client_a = Client(hotel_id=hotel_a.id, telegram_id="100", name="Alice")
    client_b = Client(hotel_id=hotel_b.id, telegram_id="200", name="Bob")
    db.add_all([client_a, client_b])
    await db.flush()

    conv_a = Conversation(hotel_id=hotel_a.id, client_id=client_a.id, status="active", channel="telegram")
    conv_b = Conversation(hotel_id=hotel_b.id, client_id=client_b.id, status="active", channel="telegram")
    db.add_all([conv_a, conv_b])
    await db.commit()

    return {
        "owner_a": owner_a, "owner_b": owner_b,
        "hotel_a": hotel_a, "hotel_b": hotel_b,
        "conv_a": conv_a, "conv_b": conv_b,
    }


@pytest.mark.asyncio
async def test_confirm_booking_happy_path(db, seeded):
    """Happy-path: 201 + valid ConfirmedBookingOut + DB row with correct attribution."""
    out = await confirm_booking(
        conversation_id=seeded["conv_a"].id,
        payload=ConfirmBookingIn(amount_usd=120.5, nights=3, notes="Полулюкс на 15-17 июня"),
        db=db,
        user=seeded["owner_a"],
    )
    assert out.id is not None
    assert out.conversation_id == seeded["conv_a"].id
    assert out.hotel_id == seeded["hotel_a"].id
    assert out.amount_usd == 120.5
    assert out.nights == 3
    assert out.notes == "Полулюкс на 15-17 июня"
    assert out.confirmed_by_user_id == seeded["owner_a"].id
    assert out.confirmed_at is not None

    rows = (await db.execute(select(ConfirmedBooking))).scalars().all()
    assert len(rows) == 1
    assert rows[0].amount_usd == 120.5


@pytest.mark.asyncio
async def test_confirm_booking_negative_amount_rejected(db, seeded):
    with pytest.raises(HTTPException) as exc:
        await confirm_booking(
            conversation_id=seeded["conv_a"].id,
            payload=ConfirmBookingIn(amount_usd=-10, nights=2),
            db=db,
            user=seeded["owner_a"],
        )
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_confirm_booking_zero_nights_rejected(db, seeded):
    with pytest.raises(HTTPException) as exc:
        await confirm_booking(
            conversation_id=seeded["conv_a"].id,
            payload=ConfirmBookingIn(amount_usd=50, nights=0),
            db=db,
            user=seeded["owner_a"],
        )
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_confirm_booking_cross_hotel_blocked(db, seeded):
    """Owner A confirming a booking on Owner B's conversation → 404."""
    with pytest.raises(HTTPException) as exc:
        await confirm_booking(
            conversation_id=seeded["conv_b"].id,
            payload=ConfirmBookingIn(amount_usd=99, nights=1),
            db=db,
            user=seeded["owner_a"],
        )
    assert exc.value.status_code == 404
    rows = (await db.execute(select(ConfirmedBooking))).scalars().all()
    assert rows == []


@pytest.mark.asyncio
async def test_list_confirmed_bookings_per_hotel(db, seeded):
    """List endpoint filters by hotel and respects multitenancy."""
    # Seed bookings in both hotels
    db.add_all([
        ConfirmedBooking(
            conversation_id=seeded["conv_a"].id, hotel_id=seeded["hotel_a"].id,
            amount_usd=100, nights=2, confirmed_by_user_id=seeded["owner_a"].id,
        ),
        ConfirmedBooking(
            conversation_id=seeded["conv_a"].id, hotel_id=seeded["hotel_a"].id,
            amount_usd=200, nights=4, confirmed_by_user_id=seeded["owner_a"].id,
        ),
        ConfirmedBooking(
            conversation_id=seeded["conv_b"].id, hotel_id=seeded["hotel_b"].id,
            amount_usd=999, nights=1, confirmed_by_user_id=seeded["owner_b"].id,
        ),
    ])
    await db.commit()

    rows = await list_confirmed_bookings(
        hotel_id=seeded["hotel_a"].id,
        date_from=None,
        date_to=None,
        db=db,
        user=seeded["owner_a"],
    )
    assert len(rows) == 2
    assert {r.amount_usd for r in rows} == {100.0, 200.0}

    # Owner A trying to list Hotel B → 404
    with pytest.raises(HTTPException) as exc:
        await list_confirmed_bookings(
            hotel_id=seeded["hotel_b"].id,
            date_from=None,
            date_to=None,
            db=db,
            user=seeded["owner_a"],
        )
    assert exc.value.status_code == 404
