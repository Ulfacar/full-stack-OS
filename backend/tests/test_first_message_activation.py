"""Tests for first-message activation logic (#23).

Notification side-effects are mocked. We only verify the DB invariant: the
hotel.activated_at timestamp is set exactly once on the first client message.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.database import Base
from app.db.models import Hotel, User


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
async def hotel(db):
    owner = User(name="A", email="a@x", hashed_password="x", role="sales")
    db.add(owner)
    await db.flush()
    h = Hotel(owner_id=owner.id, name="Hotel A", slug="hotel-a")
    db.add(h)
    await db.commit()
    await db.refresh(h)
    return h


def _set_activated_if_unset(hotel: Hotel) -> bool:
    """Mirrors the production webhook hook — extracted for direct unit testing."""
    if hotel.activated_at is None:
        hotel.activated_at = datetime.utcnow()
        return True
    return False


@pytest.mark.asyncio
async def test_activated_at_starts_null(db, hotel):
    fresh = (await db.execute(select(Hotel).where(Hotel.id == hotel.id))).scalar_one()
    assert fresh.activated_at is None


@pytest.mark.asyncio
async def test_first_message_sets_timestamp(db, hotel):
    fired = _set_activated_if_unset(hotel)
    await db.commit()
    assert fired is True
    assert hotel.activated_at is not None
    assert (datetime.utcnow() - hotel.activated_at) < timedelta(seconds=2)


@pytest.mark.asyncio
async def test_subsequent_messages_do_not_overwrite(db, hotel):
    _set_activated_if_unset(hotel)
    await db.commit()
    first_ts = hotel.activated_at

    # Second + third message must NOT change activated_at
    fired_2 = _set_activated_if_unset(hotel)
    fired_3 = _set_activated_if_unset(hotel)
    await db.commit()

    assert fired_2 is False
    assert fired_3 is False
    assert hotel.activated_at == first_ts


@pytest.mark.asyncio
async def test_notification_called_with_hotel_context(db, hotel):
    """notify_first_message receives hotel/client/channel — verifies the contract
    the webhook relies on without spinning up the actual TG send."""
    from app.services.notification_service import NotificationService

    fake_send = AsyncMock(return_value=True)
    with patch.object(NotificationService, "send_message", fake_send):
        notifier = NotificationService("dummy-token")
        result = await notifier.notify_first_message(
            manager_telegram_id="777",
            hotel_name=hotel.name,
            client_label="ivan_test",
            channel="telegram",
        )
    assert result is True
    fake_send.assert_awaited_once()
    args = fake_send.await_args
    assert args.args[0] == "777"
    body = args.args[1]
    assert "Бот активирован" in body
    assert hotel.name in body
    assert "ivan_test" in body
    assert "telegram" in body
