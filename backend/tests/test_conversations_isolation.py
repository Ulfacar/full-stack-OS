"""Multitenancy isolation tests for conversations admin endpoints (#27 M1).

Calls endpoint functions directly (no HTTP) against an in-memory SQLite. The
single concern here is: can owner A ever see owner B's data via any of the
four read endpoints? A failure in this file is a P0 production data leak.
"""

import pytest
import pytest_asyncio
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.endpoints.conversations import (
    _assert_hotel_access,
    conversation_stats,
    get_conversation,
    list_conversations,
    list_messages,
)
from app.db.database import Base
from app.db.models import Client, Conversation, Hotel, Message, User


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
    """Two unrelated owners + one admin. One conversation per hotel."""
    owner_a = User(name="Owner A", email="a@test.com", hashed_password="x", role="sales", is_active=True)
    owner_b = User(name="Owner B", email="b@test.com", hashed_password="x", role="sales", is_active=True)
    admin = User(name="Admin", email="admin@test.com", hashed_password="x", role="admin", is_active=True)
    db.add_all([owner_a, owner_b, admin])
    await db.flush()

    hotel_a = Hotel(owner_id=owner_a.id, name="Hotel A", slug="hotel-a")
    hotel_b = Hotel(owner_id=owner_b.id, name="Hotel B", slug="hotel-b")
    db.add_all([hotel_a, hotel_b])
    await db.flush()

    client_a = Client(hotel_id=hotel_a.id, telegram_id="111", name="Alice")
    client_b = Client(hotel_id=hotel_b.id, telegram_id="222", name="Bob")
    db.add_all([client_a, client_b])
    await db.flush()

    conv_a = Conversation(
        hotel_id=hotel_a.id, client_id=client_a.id,
        status="active", channel="telegram", category="booking",
    )
    conv_b = Conversation(
        hotel_id=hotel_b.id, client_id=client_b.id,
        status="active", channel="telegram", category="hotel",
    )
    db.add_all([conv_a, conv_b])
    await db.flush()

    db.add_all([
        Message(conversation_id=conv_a.id, role="user", sender="client", content="Hi A"),
        Message(conversation_id=conv_b.id, role="user", sender="client", content="Hi B"),
    ])
    await db.commit()

    return {
        "owner_a": owner_a, "owner_b": owner_b, "admin": admin,
        "hotel_a": hotel_a, "hotel_b": hotel_b,
        "client_a": client_a, "client_b": client_b,
        "conv_a": conv_a, "conv_b": conv_b,
    }


# ---------------------------------------------------------------------------
# _assert_hotel_access — single chokepoint for cross-tenant access
# ---------------------------------------------------------------------------

async def test_owner_can_access_own_hotel(db, seeded):
    hotel = await _assert_hotel_access(db, seeded["owner_a"], seeded["hotel_a"].id)
    assert hotel.id == seeded["hotel_a"].id


async def test_owner_cannot_access_other_hotel(db, seeded):
    with pytest.raises(HTTPException) as exc:
        await _assert_hotel_access(db, seeded["owner_a"], seeded["hotel_b"].id)
    assert exc.value.status_code == 404


async def test_admin_can_access_any_hotel(db, seeded):
    hotel = await _assert_hotel_access(db, seeded["admin"], seeded["hotel_b"].id)
    assert hotel.id == seeded["hotel_b"].id


async def test_nonexistent_hotel_404(db, seeded):
    with pytest.raises(HTTPException) as exc:
        await _assert_hotel_access(db, seeded["owner_a"], 99999)
    assert exc.value.status_code == 404


# ---------------------------------------------------------------------------
# Endpoint scope checks — every read path must reject cross-tenant access
# ---------------------------------------------------------------------------

async def test_list_returns_only_own_hotel(db, seeded):
    items = await list_conversations(
        hotel_id=seeded["hotel_a"].id,
        category=None, status=None, limit=50, offset=0,
        db=db, user=seeded["owner_a"],
    )
    assert len(items) == 1
    assert items[0].id == seeded["conv_a"].id


async def test_list_other_owner_404(db, seeded):
    with pytest.raises(HTTPException) as exc:
        await list_conversations(
            hotel_id=seeded["hotel_a"].id,
            category=None, status=None, limit=50, offset=0,
            db=db, user=seeded["owner_b"],
        )
    assert exc.value.status_code == 404


async def test_filter_category_does_not_bypass_scope(db, seeded):
    """Filtering by hotel_b's category must still 404 for owner_a."""
    with pytest.raises(HTTPException) as exc:
        await list_conversations(
            hotel_id=seeded["hotel_b"].id,
            category="hotel", status=None, limit=50, offset=0,
            db=db, user=seeded["owner_a"],
        )
    assert exc.value.status_code == 404


async def test_detail_other_owner_404(db, seeded):
    with pytest.raises(HTTPException) as exc:
        await get_conversation(
            conversation_id=seeded["conv_a"].id,
            db=db, user=seeded["owner_b"],
        )
    assert exc.value.status_code == 404


async def test_messages_other_owner_404(db, seeded):
    with pytest.raises(HTTPException) as exc:
        await list_messages(
            conversation_id=seeded["conv_a"].id,
            limit=100, offset=0,
            db=db, user=seeded["owner_b"],
        )
    assert exc.value.status_code == 404


async def test_stats_other_owner_404(db, seeded):
    with pytest.raises(HTTPException) as exc:
        await conversation_stats(
            hotel_id=seeded["hotel_a"].id,
            db=db, user=seeded["owner_b"],
        )
    assert exc.value.status_code == 404


async def test_admin_sees_any_hotel_list(db, seeded):
    items = await list_conversations(
        hotel_id=seeded["hotel_b"].id,
        category=None, status=None, limit=50, offset=0,
        db=db, user=seeded["admin"],
    )
    assert len(items) == 1
    assert items[0].id == seeded["conv_b"].id


async def test_detail_happy_path_returns_total_messages(db, seeded):
    """Owner reads own conversation — ConversationDetail builds fully.

    Regression test for a bug where ``model_validate(conv, from_attributes=True)``
    failed because ``total_messages`` is a derived field not present on the ORM
    model. Caught in E2E but not here until we added this test.
    """
    detail = await get_conversation(
        conversation_id=seeded["conv_a"].id,
        db=db, user=seeded["owner_a"],
    )
    assert detail.id == seeded["conv_a"].id
    assert detail.total_messages == 1  # seed-фикстура вставила 1 сообщение
    assert detail.client.name == "Alice"


async def test_stats_counts_only_scoped_hotel(db, seeded):
    """Owner A asks for hotel A stats — must not include B's conversation."""
    stats = await conversation_stats(
        hotel_id=seeded["hotel_a"].id,
        db=db, user=seeded["owner_a"],
    )
    assert stats.total == 1
    assert stats.by_category.get("booking") == 1
    assert "hotel" not in stats.by_category  # B's category must not appear
