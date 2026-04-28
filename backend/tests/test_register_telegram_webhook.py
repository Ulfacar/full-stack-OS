"""Tests for hotels.register_telegram_webhook endpoint (#9 demo-bot).

We mock TelegramService.set_webhook (the only network call) — every other
code path runs against an in-memory SQLite. Covers:
- happy path: 200 with returned webhook_url
- multitenancy: cross-hotel attempt → 404
- no token configured → 400
- WEBHOOK_BASE_URL unset on server → 500
- legacy hotel without webhook_secret → fallback generates one
- Telegram returns ok=false → endpoint surfaces 502 with description
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.api.endpoints.hotels import register_telegram_webhook
from app.core.crypto import encrypt_token
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
async def seeded(db):
    owner_a = User(name="A", email="a@x", hashed_password="x", role="sales")
    owner_b = User(name="B", email="b@x", hashed_password="x", role="sales")
    db.add_all([owner_a, owner_b])
    await db.flush()

    hotel_a = Hotel(
        owner_id=owner_a.id, name="Hotel A", slug="hotel-a",
        telegram_bot_token=encrypt_token("123:fake-token-A"),
        webhook_secret="secret-a-32hex",
    )
    hotel_b = Hotel(owner_id=owner_b.id, name="Hotel B", slug="hotel-b")
    db.add_all([hotel_a, hotel_b])
    await db.commit()
    return {"owner_a": owner_a, "owner_b": owner_b, "hotel_a": hotel_a, "hotel_b": hotel_b}


@pytest.mark.asyncio
async def test_happy_path_calls_telegram_with_decrypted_token(db, seeded):
    fake_set = AsyncMock(return_value={"ok": True, "result": True, "description": "ok"})
    with patch("app.api.endpoints.hotels.TelegramService") as MockTG, patch(
        "app.api.endpoints.hotels.settings"
    ) as MockSettings:
        MockSettings.WEBHOOK_BASE_URL = "https://exmachina-api.up.railway.app"
        MockTG.return_value.set_webhook = fake_set

        result = await register_telegram_webhook(
            hotel_id=seeded["hotel_a"].id, current_user=seeded["owner_a"], db=db,
        )

    assert result["ok"] is True
    assert result["webhook_url"] == "https://exmachina-api.up.railway.app/webhooks/telegram/hotel-a"

    # TelegramService instantiated with decrypted token (not the encrypted blob)
    MockTG.assert_called_once_with("123:fake-token-A")
    fake_set.assert_awaited_once()
    call_kwargs = fake_set.await_args.kwargs
    assert call_kwargs["secret_token"] == "secret-a-32hex"
    assert fake_set.await_args.args[0] == "https://exmachina-api.up.railway.app/webhooks/telegram/hotel-a"


@pytest.mark.asyncio
async def test_cross_hotel_blocked(db, seeded):
    """Owner A trying to register the webhook on Owner B's hotel → 404."""
    with patch("app.api.endpoints.hotels.settings") as MockSettings:
        MockSettings.WEBHOOK_BASE_URL = "https://exmachina-api.up.railway.app"
        with pytest.raises(HTTPException) as exc:
            await register_telegram_webhook(
                hotel_id=seeded["hotel_b"].id, current_user=seeded["owner_a"], db=db,
            )
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_no_token_400(db, seeded):
    seeded["hotel_a"].telegram_bot_token = None
    await db.commit()
    with patch("app.api.endpoints.hotels.settings") as MockSettings:
        MockSettings.WEBHOOK_BASE_URL = "https://exmachina-api.up.railway.app"
        with pytest.raises(HTTPException) as exc:
            await register_telegram_webhook(
                hotel_id=seeded["hotel_a"].id, current_user=seeded["owner_a"], db=db,
            )
    assert exc.value.status_code == 400
    assert "token" in exc.value.detail.lower()


@pytest.mark.asyncio
async def test_no_webhook_base_url_500(db, seeded):
    """If the server itself is misconfigured (no WEBHOOK_BASE_URL) → 500."""
    with patch("app.api.endpoints.hotels.settings") as MockSettings:
        MockSettings.WEBHOOK_BASE_URL = ""
        with pytest.raises(HTTPException) as exc:
            await register_telegram_webhook(
                hotel_id=seeded["hotel_a"].id, current_user=seeded["owner_a"], db=db,
            )
    assert exc.value.status_code == 500


@pytest.mark.asyncio
async def test_legacy_hotel_without_webhook_secret_generates_one(db, seeded):
    """Pre-INFRA-1 hotels may lack a webhook_secret — endpoint backfills it."""
    seeded["hotel_a"].webhook_secret = None
    await db.commit()
    fake_set = AsyncMock(return_value={"ok": True, "result": True})
    with patch("app.api.endpoints.hotels.TelegramService") as MockTG, patch(
        "app.api.endpoints.hotels.settings"
    ) as MockSettings:
        MockSettings.WEBHOOK_BASE_URL = "https://exmachina-api.up.railway.app"
        MockTG.return_value.set_webhook = fake_set
        await register_telegram_webhook(
            hotel_id=seeded["hotel_a"].id, current_user=seeded["owner_a"], db=db,
        )

    await db.refresh(seeded["hotel_a"])
    assert seeded["hotel_a"].webhook_secret  # backfilled
    fake_set.assert_awaited_once()


@pytest.mark.asyncio
async def test_telegram_returns_not_ok_502(db, seeded):
    """If Telegram itself rejects setWebhook (e.g. invalid URL) → 502 with TG description."""
    fake_set = AsyncMock(return_value={"ok": False, "error_code": 400, "description": "Bad Request: bad webhook URL"})
    with patch("app.api.endpoints.hotels.TelegramService") as MockTG, patch(
        "app.api.endpoints.hotels.settings"
    ) as MockSettings:
        MockSettings.WEBHOOK_BASE_URL = "https://exmachina-api.up.railway.app"
        MockTG.return_value.set_webhook = fake_set

        with pytest.raises(HTTPException) as exc:
            await register_telegram_webhook(
                hotel_id=seeded["hotel_a"].id, current_user=seeded["owner_a"], db=db,
            )
    assert exc.value.status_code == 502
    assert "bad webhook URL" in exc.value.detail
