"""Conversations admin endpoints — read-only dialog inbox per hotel.

Phase: Sprint 1 #27 (M1 backend). Read-only MVP — list + filter + drill-down.
Two-way operator channel and ROI-button live in Sprint 2.

Access model
------------
Conversations are scoped per hotel. A hotel is owned by one User
(``Hotel.owner_id``); an admin may inspect any hotel. Anything that returns
conversation data (list, detail, messages, stats) goes through
``_assert_hotel_access`` first — this is the single chokepoint that prevents
cross-tenant data leakage.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ...db.database import get_db
from ...db.models import Conversation, Message, Client, Hotel, User
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class ClientPreview(BaseModel):
    id: int
    name: Optional[str]
    telegram_username: Optional[str]
    whatsapp_phone: Optional[str]
    language: Optional[str]

    class Config:
        from_attributes = True


class ConversationListItem(BaseModel):
    id: int
    status: str
    channel: Optional[str]
    category: Optional[str]
    last_message_at: Optional[datetime]
    last_message_preview: Optional[str]
    unread_count: int
    assigned_user_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    client: ClientPreview

    class Config:
        from_attributes = True


class ConversationDetail(ConversationListItem):
    operator_telegram_id: Optional[str]
    total_messages: int


class MessageOut(BaseModel):
    id: int
    sender: Optional[str]  # client | bot | operator
    role: str  # OpenAI-format: user | assistant | system
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationStats(BaseModel):
    total: int
    unread_total: int
    by_category: dict[str, int]  # {"booking": N, "hotel": N, "service": N, "general": N, "uncategorized": N}
    by_status: dict[str, int]    # {"active": N, "needs_operator": N, "operator_active": N, "completed": N}


# ---------------------------------------------------------------------------
# Access helpers
# ---------------------------------------------------------------------------

async def _assert_hotel_access(db: AsyncSession, user: User, hotel_id: int) -> Hotel:
    """Raise 404 if hotel does not exist or user has no access.

    Admin sees any hotel; otherwise owner-only. We collapse "not found" and
    "not yours" into a single 404 to avoid leaking hotel existence to a
    non-owner via timing or wording.
    """
    result = await db.execute(select(Hotel).where(Hotel.id == hotel_id))
    hotel = result.scalar_one_or_none()
    if hotel is None:
        raise HTTPException(status_code=404, detail="Hotel not found")
    if user.role != "admin" and hotel.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return hotel


async def _load_conversation_scoped(
    db: AsyncSession, user: User, conversation_id: int
) -> Conversation:
    """Load conversation + verify the caller can see its hotel."""
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.client))
        .where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    await _assert_hotel_access(db, user, conv.hotel_id)
    return conv


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=List[ConversationListItem])
async def list_conversations(
    hotel_id: int = Query(..., description="Hotel to list conversations for"),
    category: Optional[str] = Query(None, description="booking | hotel | service | general"),
    status: Optional[str] = Query(None, description="active | needs_operator | operator_active | completed"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Inbox feed for a hotel: most-recently-active first.

    Sorted by ``last_message_at`` desc with ``updated_at`` fallback for legacy
    conversations created before INFRA-1 backfilled the column.
    """
    await _assert_hotel_access(db, user, hotel_id)

    query = (
        select(Conversation)
        .options(selectinload(Conversation.client))
        .where(Conversation.hotel_id == hotel_id)
        .order_by(
            func.coalesce(Conversation.last_message_at, Conversation.updated_at, Conversation.created_at).desc()
        )
        .limit(limit)
        .offset(offset)
    )
    if category:
        query = query.where(Conversation.category == category)
    if status:
        query = query.where(Conversation.status == status)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/stats", response_model=ConversationStats)
async def conversation_stats(
    hotel_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Aggregated counts for chips/badges in the admin UI."""
    await _assert_hotel_access(db, user, hotel_id)

    base = select(func.count(Conversation.id)).where(Conversation.hotel_id == hotel_id)

    total = (await db.execute(base)).scalar() or 0
    unread_total = (
        await db.execute(
            select(func.coalesce(func.sum(Conversation.unread_count), 0))
            .where(Conversation.hotel_id == hotel_id)
        )
    ).scalar() or 0

    cat_rows = (
        await db.execute(
            select(Conversation.category, func.count(Conversation.id))
            .where(Conversation.hotel_id == hotel_id)
            .group_by(Conversation.category)
        )
    ).all()
    by_category: dict[str, int] = {}
    for cat, count in cat_rows:
        by_category[cat or "uncategorized"] = count

    status_rows = (
        await db.execute(
            select(Conversation.status, func.count(Conversation.id))
            .where(Conversation.hotel_id == hotel_id)
            .group_by(Conversation.status)
        )
    ).all()
    by_status: dict[str, int] = {s or "unknown": c for s, c in status_rows}

    return ConversationStats(
        total=total,
        unread_total=int(unread_total),
        by_category=by_category,
        by_status=by_status,
    )


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Full conversation card with client info and message count."""
    conv = await _load_conversation_scoped(db, user, conversation_id)
    total_messages = (
        await db.execute(
            select(func.count(Message.id)).where(Message.conversation_id == conversation_id)
        )
    ).scalar() or 0

    payload = ConversationDetail.model_validate(conv, from_attributes=True)
    payload.total_messages = total_messages
    return payload


@router.get("/{conversation_id}/messages", response_model=List[MessageOut])
async def list_messages(
    conversation_id: int,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Messages of one conversation in chronological order (oldest first)."""
    await _load_conversation_scoped(db, user, conversation_id)

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc(), Message.id.asc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()
