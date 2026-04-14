from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import datetime, timedelta
from ...db.database import get_db
from ...db.models import User, Hotel, Conversation, Message, AIUsage, Billing
from ..dependencies import get_current_user
from ..schemas import HotelWithStats, AdminStats, AIUsageDaily, BillingRecord, HotelStatsResponse, User as UserSchema
from ...services.budget_service import budget_service
from ...core.security import get_password_hash

router = APIRouter(prefix="/admin", tags=["admin"])

# Cost per token (Claude 3.5 Haiku approximate)
COST_PER_PROMPT_TOKEN = 0.00000025
COST_PER_COMPLETION_TOKEN = 0.00000125


@router.get("/hotels/", response_model=List[HotelWithStats])
async def get_admin_hotels(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all hotels with AI usage stats for OS Dashboard."""
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    result = await db.execute(
        select(Hotel).where(Hotel.owner_id == current_user.id).order_by(Hotel.created_at.desc())
    )
    hotels = result.scalars().all()

    hotels_with_stats = []
    for hotel in hotels:
        # Conversations this month
        conv_result = await db.execute(
            select(func.count(Conversation.id)).where(
                and_(Conversation.hotel_id == hotel.id, Conversation.created_at >= month_start)
            )
        )
        conversations_month = conv_result.scalar() or 0

        # Active conversations
        active_result = await db.execute(
            select(func.count(Conversation.id)).where(
                and_(Conversation.hotel_id == hotel.id, Conversation.status == "active")
            )
        )
        active_conversations = active_result.scalar() or 0

        # AI cost this month (use pre-calculated cost_usd)
        cost_result = await db.execute(
            select(func.coalesce(func.sum(AIUsage.cost_usd), 0.0)).where(
                and_(AIUsage.hotel_id == hotel.id, AIUsage.created_at >= month_start)
            )
        )
        ai_cost = float(cost_result.scalar())
        budget_used = ai_cost
        budget_remaining = max(0, (hotel.monthly_budget or 5.0) - budget_used)

        # Last activity
        last_msg = await db.execute(
            select(Message.created_at)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(Conversation.hotel_id == hotel.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        last_msg_time = last_msg.scalar_one_or_none()
        last_activity = format_time_ago(last_msg_time) if last_msg_time else None

        # Requests handled = messages from assistant this month
        handled_result = await db.execute(
            select(func.count(Message.id))
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                and_(
                    Conversation.hotel_id == hotel.id,
                    Message.role == "assistant",
                    Message.created_at >= month_start,
                )
            )
        )
        requests_handled = handled_result.scalar() or 0

        hotels_with_stats.append(HotelWithStats(
            id=hotel.id,
            name=hotel.name,
            slug=hotel.slug,
            ai_model=hotel.ai_model,
            communication_style=hotel.communication_style or "friendly",
            languages=hotel.languages or ["ru", "en"],
            is_active=hotel.is_active,
            status=hotel.status or "demo",
            monthly_budget=hotel.monthly_budget or 5.0,
            budget_used=round(budget_used, 4),
            budget_remaining=round(budget_remaining, 4),
            created_at=hotel.created_at,
            updated_at=hotel.updated_at,
            conversations_month=conversations_month,
            active_conversations=active_conversations,
            ai_cost_month=round(ai_cost, 4),
            last_activity=last_activity,
            requests_handled=requests_handled,
        ))

    return hotels_with_stats


@router.get("/stats/", response_model=AdminStats)
async def get_admin_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get overall platform statistics for OS Dashboard."""
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Total hotels
    total_result = await db.execute(
        select(func.count(Hotel.id)).where(Hotel.owner_id == current_user.id)
    )
    total_hotels = total_result.scalar() or 0

    # Active hotels
    active_result = await db.execute(
        select(func.count(Hotel.id)).where(
            and_(Hotel.owner_id == current_user.id, Hotel.is_active == True)
        )
    )
    active_hotels = active_result.scalar() or 0

    # Total conversations this month
    hotel_ids_result = await db.execute(
        select(Hotel.id).where(Hotel.owner_id == current_user.id)
    )
    hotel_ids = [row[0] for row in hotel_ids_result.all()]

    total_conversations = 0
    total_ai_cost = 0.0

    if hotel_ids:
        conv_result = await db.execute(
            select(func.count(Conversation.id)).where(
                and_(
                    Conversation.hotel_id.in_(hotel_ids),
                    Conversation.created_at >= month_start,
                )
            )
        )
        total_conversations = conv_result.scalar() or 0

        # Total AI cost
        usage_result = await db.execute(
            select(
                func.coalesce(func.sum(AIUsage.prompt_tokens), 0),
                func.coalesce(func.sum(AIUsage.completion_tokens), 0),
            ).where(
                and_(
                    AIUsage.hotel_id.in_(hotel_ids),
                    AIUsage.created_at >= month_start,
                )
            )
        )
        usage_row = usage_result.one()
        total_ai_cost = (
            usage_row[0] * COST_PER_PROMPT_TOKEN +
            usage_row[1] * COST_PER_COMPLETION_TOKEN
        )

    return AdminStats(
        total_hotels=total_hotels,
        active_hotels=active_hotels,
        total_conversations_month=total_conversations,
        total_ai_cost_month=round(total_ai_cost, 2),
        openrouter_balance=0.0,  # TODO: fetch from OpenRouter API
    )


@router.get("/stats/daily", response_model=List[AIUsageDaily])
async def get_daily_usage(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get daily AI usage breakdown for the current month."""
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    hotel_ids_result = await db.execute(
        select(Hotel.id).where(Hotel.owner_id == current_user.id)
    )
    hotel_ids = [row[0] for row in hotel_ids_result.all()]

    if not hotel_ids:
        return []

    # Group by date
    result = await db.execute(
        select(
            func.date(AIUsage.created_at).label("date"),
            func.count(func.distinct(AIUsage.conversation_id)).label("conversations"),
            func.coalesce(func.sum(AIUsage.prompt_tokens), 0).label("prompt_tokens"),
            func.coalesce(func.sum(AIUsage.completion_tokens), 0).label("completion_tokens"),
        )
        .where(
            and_(
                AIUsage.hotel_id.in_(hotel_ids),
                AIUsage.created_at >= month_start,
            )
        )
        .group_by(func.date(AIUsage.created_at))
        .order_by(func.date(AIUsage.created_at))
    )

    daily = []
    for row in result.all():
        cost = row.prompt_tokens * COST_PER_PROMPT_TOKEN + row.completion_tokens * COST_PER_COMPLETION_TOKEN
        daily.append(AIUsageDaily(
            date=str(row.date),
            conversations=row.conversations,
            prompt_tokens=row.prompt_tokens,
            completion_tokens=row.completion_tokens,
            cost=round(cost, 3),
        ))

    return daily


@router.get("/billing/", response_model=List[BillingRecord])
async def get_billing(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get billing records with optional status filter."""
    hotel_ids_result = await db.execute(
        select(Hotel.id).where(Hotel.owner_id == current_user.id)
    )
    hotel_ids = [row[0] for row in hotel_ids_result.all()]

    if not hotel_ids:
        return []

    query = (
        select(Billing, Hotel.name.label("hotel_name"))
        .join(Hotel, Billing.hotel_id == Hotel.id)
        .where(Billing.hotel_id.in_(hotel_ids))
    )

    if status:
        query = query.where(Billing.status == status)

    query = query.order_by(Billing.month.desc(), Hotel.name)
    result = await db.execute(query)

    records = []
    for row in result.all():
        billing = row[0]
        hotel_name = row[1]
        records.append(BillingRecord(
            id=billing.id,
            hotel_id=billing.hotel_id,
            hotel_name=hotel_name,
            month=billing.month,
            amount=billing.amount,
            status=billing.status,
            paid_at=billing.paid_at,
            created_at=billing.created_at,
        ))

    return records


@router.get("/users/", response_model=List[UserSchema])
async def get_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all users (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.post("/users/create-sales", response_model=UserSchema)
async def create_sales_user(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a sales user (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    email = data.get("email")
    name = data.get("name")
    password = data.get("password")

    if not email or not name or not password:
        raise HTTPException(status_code=400, detail="email, name, password required")

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        name=name,
        email=email,
        hashed_password=get_password_hash(password),
        role="sales",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/hotels/{hotel_id}/budget")
async def get_hotel_budget(
    hotel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get hotel budget details."""
    result = await db.execute(select(Hotel).where(Hotel.id == hotel_id))
    hotel = result.scalar_one_or_none()
    if not hotel or hotel.owner_id != current_user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Hotel not found")

    spent = await budget_service.get_monthly_spend(hotel_id, db)
    return {
        "hotel_id": hotel_id,
        "monthly_budget": hotel.monthly_budget or 5.0,
        "budget_used": round(spent, 4),
        "budget_remaining": round(max(0, (hotel.monthly_budget or 5.0) - spent), 4),
        "status": hotel.status,
    }


@router.put("/hotels/{hotel_id}/budget")
async def update_hotel_budget(
    hotel_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update hotel monthly budget."""
    result = await db.execute(select(Hotel).where(Hotel.id == hotel_id))
    hotel = result.scalar_one_or_none()
    if not hotel or hotel.owner_id != current_user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Hotel not found")

    if "monthly_budget" in data:
        hotel.monthly_budget = float(data["monthly_budget"])
    if "status" in data and data["status"] in ("demo", "active", "suspended"):
        hotel.status = data["status"]

    await db.commit()
    await db.refresh(hotel)

    spent = await budget_service.get_monthly_spend(hotel_id, db)
    return {
        "hotel_id": hotel_id,
        "monthly_budget": hotel.monthly_budget,
        "budget_used": round(spent, 4),
        "budget_remaining": round(max(0, hotel.monthly_budget - spent), 4),
        "status": hotel.status,
    }


def format_time_ago(dt: datetime) -> str:
    """Format datetime as human-readable 'time ago' string."""
    now = datetime.utcnow()
    diff = now - dt

    if diff.total_seconds() < 60:
        return "только что"
    elif diff.total_seconds() < 3600:
        minutes = int(diff.total_seconds() / 60)
        return f"{minutes} мин назад"
    elif diff.total_seconds() < 86400:
        hours = int(diff.total_seconds() / 3600)
        return f"{hours} час назад"
    else:
        days = diff.days
        return f"{days} дн назад"
