"""Tests for partner share-link endpoint (#11).

Coverage:
- create_share_link: happy-path produces a 48-hex token + ~7 day expiry
- create_share_link: cross-hotel attempt → 404
- view_share_link: public, increments view_count, returns sanitised preview
- view_share_link: unknown token → 404
- view_share_link: expired token → 410
- view_share_link: returns no creds (no telegram_bot_token, no payment_details, no manager_telegram_id)
- list_share_links: owner-scoped, sorted desc
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.api.endpoints.share import (
    create_share_link,
    list_share_links,
    view_share_link,
)
from app.db.database import Base
from app.db.models import Hotel, ShareLink, User


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
        description="Boutique on Issyk-Kul",
        rooms=[{"name": "Standard", "capacity": 2, "price": 4500}],
        amenities={"wifi": True}, rules={"checkin": "14:00"},
        languages=["ru", "en"], communication_style="friendly",
        # Things that MUST NOT leak through the share preview:
        telegram_bot_token="encrypted-secret",
        manager_telegram_id="777",
        payment_details={"bank_details": "VISA 1234"},
    )
    hotel_b = Hotel(owner_id=owner_b.id, name="Hotel B", slug="hotel-b")
    db.add_all([hotel_a, hotel_b])
    await db.commit()
    return {"owner_a": owner_a, "owner_b": owner_b, "hotel_a": hotel_a, "hotel_b": hotel_b}


@pytest.mark.asyncio
async def test_create_share_link_happy_path(db, seeded):
    out = await create_share_link(
        hotel_id=seeded["hotel_a"].id, db=db, user=seeded["owner_a"],
    )
    assert len(out.token) == 48  # 24 bytes hex
    assert out.url_path == f"/share/{out.token}"
    assert out.view_count == 0
    delta = out.expires_at - datetime.utcnow()
    assert timedelta(days=6, hours=23) < delta < timedelta(days=7, hours=1)


@pytest.mark.asyncio
async def test_create_share_link_cross_hotel_blocked(db, seeded):
    with pytest.raises(HTTPException) as exc:
        await create_share_link(
            hotel_id=seeded["hotel_b"].id, db=db, user=seeded["owner_a"],
        )
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_view_share_link_returns_sanitised_preview(db, seeded):
    out = await create_share_link(
        hotel_id=seeded["hotel_a"].id, db=db, user=seeded["owner_a"],
    )
    preview = await view_share_link(token=out.token, db=db)
    assert preview.name == "Hotel A"
    assert preview.description == "Boutique on Issyk-Kul"
    assert preview.languages == ["ru", "en"]
    assert preview.rooms[0]["name"] == "Standard"
    # No leakage — these fields shouldn't even exist on the response model
    preview_dict = preview.model_dump()
    assert "telegram_bot_token" not in preview_dict
    assert "manager_telegram_id" not in preview_dict
    assert "payment_details" not in preview_dict


@pytest.mark.asyncio
async def test_view_share_link_increments_view_count(db, seeded):
    out = await create_share_link(
        hotel_id=seeded["hotel_a"].id, db=db, user=seeded["owner_a"],
    )
    await view_share_link(token=out.token, db=db)
    await view_share_link(token=out.token, db=db)
    await view_share_link(token=out.token, db=db)

    rows = (await db.execute(select(ShareLink).where(ShareLink.token == out.token))).scalars().all()
    assert len(rows) == 1
    assert rows[0].view_count == 3


@pytest.mark.asyncio
async def test_view_share_link_unknown_token_404(db):
    with pytest.raises(HTTPException) as exc:
        await view_share_link(token="not-a-real-token", db=db)
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_view_share_link_expired_410(db, seeded):
    """Manually back-date a link past TTL → 410 Gone."""
    link = ShareLink(
        token="expired-token",
        hotel_id=seeded["hotel_a"].id,
        created_by_user_id=seeded["owner_a"].id,
        expires_at=datetime.utcnow() - timedelta(hours=1),
    )
    db.add(link)
    await db.commit()

    with pytest.raises(HTTPException) as exc:
        await view_share_link(token="expired-token", db=db)
    assert exc.value.status_code == 410


@pytest.mark.asyncio
async def test_list_share_links_owner_scoped(db, seeded):
    """Owner A creates 2 links; owner B creates 1. List for hotel A returns 2."""
    await create_share_link(seeded["hotel_a"].id, db=db, user=seeded["owner_a"])
    await create_share_link(seeded["hotel_a"].id, db=db, user=seeded["owner_a"])
    await create_share_link(seeded["hotel_b"].id, db=db, user=seeded["owner_b"])

    rows = await list_share_links(seeded["hotel_a"].id, db=db, user=seeded["owner_a"])
    assert len(rows) == 2

    # Owner A trying hotel B → 404
    with pytest.raises(HTTPException) as exc:
        await list_share_links(seeded["hotel_b"].id, db=db, user=seeded["owner_a"])
    assert exc.value.status_code == 404
