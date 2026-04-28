"""Tests for two-way manager↔client channel (#26 M1).

Coverage:
- state map: set / get / clear / cross-operator isolation / TTL expiry (5 tests)
- handle_operator_message:
  - no active state → False, ignored
  - cross-hotel state → False, state cleared (multitenancy)
  - happy path: persists Message(sender=operator) + sets assigned_user_id +
    flips status to operator_active + delivers via TG
  - missing client TG creds → False, no crash
"""
from __future__ import annotations

import time
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.api.endpoints.conversations import (
    OperatorReplyIn,
    send_operator_reply,
)
from app.db.database import Base
from app.db.models import Client, Conversation, Hotel, Message, User
from app.services import operator_service
from app.services.operator_service import (
    STATE_TTL_SECONDS,
    _reset_state_for_tests,
    clear_operator_reply_state,
    get_active_conversation_id,
    handle_operator_message,
    set_operator_reply_state,
)
from fastapi import HTTPException


# === Fixtures ===

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
    """Two unrelated hotels (multitenancy), one TG client + conversation each.

    Hotel A's manager_telegram_id = "777". Hotel B's manager = "888".
    Bot tokens are deliberately invalid Fernet payloads — patch decrypt_token
    in tests that exercise actual delivery.
    """
    owner_a = User(name="A", email="a@x", hashed_password="x", role="sales")
    owner_b = User(name="B", email="b@x", hashed_password="x", role="sales")
    db.add_all([owner_a, owner_b])
    await db.flush()

    hotel_a = Hotel(
        owner_id=owner_a.id, name="Hotel A", slug="hotel-a",
        telegram_bot_token="encrypted-A", manager_telegram_id="777",
    )
    hotel_b = Hotel(
        owner_id=owner_b.id, name="Hotel B", slug="hotel-b",
        telegram_bot_token="encrypted-B", manager_telegram_id="888",
    )
    db.add_all([hotel_a, hotel_b])
    await db.flush()

    client_a = Client(hotel_id=hotel_a.id, telegram_id="100", name="Alice")
    client_b = Client(hotel_id=hotel_b.id, telegram_id="200", name="Bob")
    db.add_all([client_a, client_b])
    await db.flush()

    conv_a = Conversation(
        hotel_id=hotel_a.id, client_id=client_a.id,
        status="needs_operator", channel="telegram",
    )
    conv_b = Conversation(
        hotel_id=hotel_b.id, client_id=client_b.id,
        status="needs_operator", channel="telegram",
    )
    db.add_all([conv_a, conv_b])
    await db.commit()

    return {
        "owner_a": owner_a, "owner_b": owner_b,
        "hotel_a": hotel_a, "hotel_b": hotel_b,
        "client_a": client_a, "client_b": client_b,
        "conv_a": conv_a, "conv_b": conv_b,
    }


@pytest.fixture(autouse=True)
def reset_state():
    """Wipe module-level state before every test."""
    _reset_state_for_tests()
    yield
    _reset_state_for_tests()


# === State map ===

def test_state_set_and_get():
    set_operator_reply_state("777", 42)
    assert get_active_conversation_id("777") == 42


def test_state_clear():
    set_operator_reply_state("777", 42)
    clear_operator_reply_state("777")
    assert get_active_conversation_id("777") is None


def test_state_isolation_per_operator():
    set_operator_reply_state("777", 42)
    set_operator_reply_state("888", 99)
    assert get_active_conversation_id("777") == 42
    assert get_active_conversation_id("888") == 99


def test_state_unknown_operator_returns_none():
    assert get_active_conversation_id("nobody") is None


def test_state_expires_after_ttl(monkeypatch):
    base = time.time()
    monkeypatch.setattr(operator_service.time, "time", lambda: base)
    set_operator_reply_state("777", 42)
    # advance past TTL
    monkeypatch.setattr(operator_service.time, "time", lambda: base + STATE_TTL_SECONDS + 1)
    assert get_active_conversation_id("777") is None


def test_state_replaces_previous_on_reset():
    """Manager re-tapping Reply on a different conv overrides the old binding."""
    set_operator_reply_state("777", 42)
    set_operator_reply_state("777", 99)
    assert get_active_conversation_id("777") == 99


# === handle_operator_message ===

@pytest.mark.asyncio
async def test_handle_no_active_state_returns_false(db, seeded):
    delivered = await handle_operator_message(
        operator_tg_id="777",
        text="hi",
        hotel=seeded["hotel_a"],
        db=db,
    )
    assert delivered is False
    # No new message persisted
    msgs = (await db.execute(select(Message))).scalars().all()
    assert msgs == []


@pytest.mark.asyncio
async def test_handle_cross_hotel_state_blocked(db, seeded):
    """Operator A's state pointing to Hotel B's conversation must be rejected
    when the message arrives on Hotel A's webhook (multitenancy guard)."""
    set_operator_reply_state("777", seeded["conv_b"].id)
    delivered = await handle_operator_message(
        operator_tg_id="777",
        text="leak attempt",
        hotel=seeded["hotel_a"],
        db=db,
    )
    assert delivered is False
    # State was cleared after the rejection
    assert get_active_conversation_id("777") is None
    # No message persisted in conv_b
    msgs = (await db.execute(
        select(Message).where(Message.conversation_id == seeded["conv_b"].id)
    )).scalars().all()
    assert msgs == []


@pytest.mark.asyncio
async def test_handle_happy_path_persists_and_delivers(db, seeded):
    """Full happy path: state set → message arrives → DB row + status flip +
    delivery to client TG. Stub the TG send so we don't hit real API."""
    set_operator_reply_state("777", seeded["conv_a"].id)

    fake_send = AsyncMock(return_value={"ok": True})
    with patch(
        "app.services.operator_service.TelegramService"
    ) as MockTG, patch(
        "app.services.operator_service.decrypt_token", return_value="plain"
    ):
        MockTG.return_value.send_message = fake_send
        delivered = await handle_operator_message(
            operator_tg_id="777",
            text="привет, через 10 минут будем",
            hotel=seeded["hotel_a"],
            db=db,
        )

    assert delivered is True
    fake_send.assert_awaited_once()
    call_kwargs = fake_send.await_args.kwargs
    assert call_kwargs["chat_id"] == 100  # client_a.telegram_id
    assert "10 минут" in call_kwargs["text"]

    # DB state
    await db.refresh(seeded["conv_a"])
    assert seeded["conv_a"].status == "operator_active"
    assert seeded["conv_a"].assigned_user_id == seeded["owner_a"].id
    assert seeded["conv_a"].operator_telegram_id == "777"
    assert seeded["conv_a"].last_message_preview.startswith("привет")

    msgs = (await db.execute(
        select(Message).where(Message.conversation_id == seeded["conv_a"].id)
    )).scalars().all()
    assert len(msgs) == 1
    assert msgs[0].sender == "operator"
    assert msgs[0].role == "user"
    assert msgs[0].content == "привет, через 10 минут будем"


@pytest.mark.asyncio
async def test_handle_client_missing_telegram_id_returns_false(db, seeded):
    """If client has no telegram_id, delivery fails gracefully (no crash)."""
    seeded["client_a"].telegram_id = None
    await db.commit()

    set_operator_reply_state("777", seeded["conv_a"].id)
    with patch(
        "app.services.operator_service.decrypt_token", return_value="plain"
    ):
        delivered = await handle_operator_message(
            operator_tg_id="777",
            text="...",
            hotel=seeded["hotel_a"],
            db=db,
        )
    assert delivered is False
    # Message still persisted for audit (it'd be wrong to silently lose data)
    msgs = (await db.execute(
        select(Message).where(Message.conversation_id == seeded["conv_a"].id)
    )).scalars().all()
    assert len(msgs) == 1


# === POST /conversations/{id}/operator-reply (M2 admin-panel input) ===

@pytest.mark.asyncio
async def test_operator_reply_happy_path_returns_message(db, seeded):
    """Authenticated owner sends a reply → DB row + status flip + delivery + valid MessageOut."""
    fake_send = AsyncMock(return_value={"ok": True})
    with patch(
        "app.services.operator_service.TelegramService"
    ) as MockTG, patch(
        "app.services.operator_service.decrypt_token", return_value="plain"
    ):
        MockTG.return_value.send_message = fake_send
        result = await send_operator_reply(
            conversation_id=seeded["conv_a"].id,
            payload=OperatorReplyIn(text="ответ из админки"),
            db=db,
            user=seeded["owner_a"],
        )

    assert result.sender == "operator"
    assert result.role == "user"
    assert result.content == "ответ из админки"
    assert result.id is not None
    assert result.created_at is not None

    fake_send.assert_awaited_once()

    await db.refresh(seeded["conv_a"])
    assert seeded["conv_a"].status == "operator_active"
    assert seeded["conv_a"].assigned_user_id == seeded["owner_a"].id
    assert seeded["conv_a"].last_message_preview == "ответ из админки"


@pytest.mark.asyncio
async def test_operator_reply_empty_text_rejected(db, seeded):
    with pytest.raises(HTTPException) as exc:
        await send_operator_reply(
            conversation_id=seeded["conv_a"].id,
            payload=OperatorReplyIn(text="   "),
            db=db,
            user=seeded["owner_a"],
        )
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_operator_reply_cross_hotel_blocked(db, seeded):
    """Owner A must not be able to reply in Owner B's conversation."""
    with pytest.raises(HTTPException) as exc:
        await send_operator_reply(
            conversation_id=seeded["conv_b"].id,
            payload=OperatorReplyIn(text="leak"),
            db=db,
            user=seeded["owner_a"],
        )
    assert exc.value.status_code == 404
    # No new message created on conv_b
    msgs = (await db.execute(
        select(Message).where(Message.conversation_id == seeded["conv_b"].id)
    )).scalars().all()
    assert msgs == []


@pytest.mark.asyncio
async def test_operator_reply_delivery_failure_returns_502_but_persists(db, seeded):
    """Delivery layer failure → message saved (audit) but caller sees 502."""
    seeded["client_a"].telegram_id = None
    await db.commit()

    with patch(
        "app.services.operator_service.decrypt_token", return_value="plain"
    ):
        with pytest.raises(HTTPException) as exc:
            await send_operator_reply(
                conversation_id=seeded["conv_a"].id,
                payload=OperatorReplyIn(text="will not deliver"),
                db=db,
                user=seeded["owner_a"],
            )
    assert exc.value.status_code == 502
    msgs = (await db.execute(
        select(Message).where(Message.conversation_id == seeded["conv_a"].id)
    )).scalars().all()
    assert len(msgs) == 1
    assert msgs[0].content == "will not deliver"
