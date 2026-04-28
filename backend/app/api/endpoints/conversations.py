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
from ...db.models import ConfirmedBooking, Conversation, Message, Client, Hotel, User
from ...services.operator_service import deliver_operator_message_to_client
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


class OperatorReplyIn(BaseModel):
    text: str


class ConfirmBookingIn(BaseModel):
    amount_usd: float
    nights: int
    notes: Optional[str] = None


class ConfirmedBookingOut(BaseModel):
    id: int
    conversation_id: int
    hotel_id: int
    amount_usd: float
    nights: int
    notes: Optional[str]
    confirmed_by_user_id: int
    confirmed_at: datetime

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

    base = ConversationListItem.model_validate(conv, from_attributes=True).model_dump()
    return ConversationDetail(
        **base,
        operator_telegram_id=conv.operator_telegram_id,
        total_messages=int(total_messages),
    )


@router.post(
    "/{conversation_id}/confirm-booking",
    response_model=ConfirmedBookingOut,
    status_code=201,
)
async def confirm_booking(
    conversation_id: int,
    payload: ConfirmBookingIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Record a manager-confirmed booking for ROI tracking (#25, raw data for #33).

    Each confirmed booking is one row — no upsert. If the manager makes a
    typo and re-submits, that's two rows; the monthly aggregator (#33) sums
    by hotel + month so the correction shows up as an extra row that the
    manager can audit later. Edit/delete is out of scope for Sprint 2.
    """
    if payload.amount_usd <= 0:
        raise HTTPException(status_code=422, detail="amount_usd must be positive")
    if payload.nights <= 0:
        raise HTTPException(status_code=422, detail="nights must be positive")

    conv = await _load_conversation_scoped(db, user, conversation_id)

    booking = ConfirmedBooking(
        conversation_id=conv.id,
        hotel_id=conv.hotel_id,
        amount_usd=payload.amount_usd,
        nights=payload.nights,
        notes=(payload.notes or None),
        confirmed_by_user_id=user.id,
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    return booking


@router.get(
    "/by-hotel/{hotel_id}/confirmed-bookings",
    response_model=List[ConfirmedBookingOut],
)
async def list_confirmed_bookings(
    hotel_id: int,
    date_from: Optional[datetime] = Query(None, alias="from"),
    date_to: Optional[datetime] = Query(None, alias="to"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """All confirmed bookings for a hotel within an optional date range.

    Will be consumed by #33 monthly ROI report (Sprint 3+). For now exposed
    so managers can audit what the bot/themselves confirmed.
    """
    await _assert_hotel_access(db, user, hotel_id)

    query = select(ConfirmedBooking).where(ConfirmedBooking.hotel_id == hotel_id)
    if date_from is not None:
        query = query.where(ConfirmedBooking.confirmed_at >= date_from)
    if date_to is not None:
        query = query.where(ConfirmedBooking.confirmed_at <= date_to)
    query = query.order_by(ConfirmedBooking.confirmed_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/{conversation_id}/operator-reply", response_model=MessageOut)
async def send_operator_reply(
    conversation_id: int,
    payload: OperatorReplyIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Send an operator-typed message to the client from the admin panel (#26 M2).

    Differs from the TG inline-reply flow (operator_service.handle_operator_message):
    here the operator is the authenticated dashboard user, not a Telegram chat
    binding — so we set ``assigned_user_id = current_user.id`` rather than the
    hotel owner's id, and we skip the in-memory state map entirely.
    """
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty message")

    conv = await _load_conversation_scoped(db, user, conversation_id)
    hotel = await _assert_hotel_access(db, user, conv.hotel_id)

    if conv.client is None:
        raise HTTPException(status_code=409, detail="Conversation has no client")

    msg = Message(
        conversation_id=conv.id,
        role="user",
        sender="operator",
        content=text,
    )
    db.add(msg)
    conv.assigned_user_id = user.id
    conv.status = "operator_active"
    conv.last_message_preview = text[:500]
    await db.commit()
    await db.refresh(msg)

    delivered = await deliver_operator_message_to_client(hotel, conv, conv.client, text)
    if not delivered:
        # Saved for audit, but client never got it — surface that to caller
        raise HTTPException(
            status_code=502,
            detail="Message saved but delivery to client failed (channel misconfigured)",
        )

    return msg


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
