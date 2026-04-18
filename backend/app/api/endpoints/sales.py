"""Sales panel endpoints — lead pipeline for salespeople.

Sales users see only their own leads (applications where created_by_user_id
matches their id). Admins see every lead regardless of creator.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.database import get_db
from ...db.models import Application, User
from ..dependencies import get_current_user

router = APIRouter(prefix="/sales", tags=["sales"])


class LeadOut(BaseModel):
    id: int
    status: str
    hotel_name: str
    contact_name: Optional[str]
    contact_phone: Optional[str]
    contact_email: Optional[str]
    form_data: Optional[dict]
    generated_prompt: Optional[str]
    hotel_id: Optional[int]
    created_by_user_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class SalesStats(BaseModel):
    total: int
    pending: int
    configuring: int
    active: int
    rejected: int


def _scope(query, user: User):
    """Sales sees only own leads. Admin sees everything."""
    if user.role == "admin":
        return query
    return query.where(Application.created_by_user_id == user.id)


@router.get("/leads", response_model=List[LeadOut])
async def list_leads(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Мои лиды (sales) или все лиды (admin), с опциональным фильтром по статусу."""
    query = select(Application).order_by(Application.created_at.desc())
    query = _scope(query, user)
    if status:
        query = query.where(Application.status == status)
    query = query.limit(max(1, min(limit, 200))).offset(max(0, offset))
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/leads/{lead_id}", response_model=LeadOut)
async def get_lead(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Карточка лида. Sales может открывать только свои, admin — любые."""
    query = select(Application).where(Application.id == lead_id)
    query = _scope(query, user)
    result = await db.execute(query)
    lead = result.scalar_one_or_none()
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.get("/stats", response_model=SalesStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Цифры для hero-панели: total/pending/configuring/active/rejected."""
    base = select(func.count(Application.id))
    base = _scope(base, user)

    total_q = base
    pending_q = base.where(Application.status == "pending")
    configuring_q = base.where(Application.status == "configuring")
    active_q = base.where(Application.status == "active")
    rejected_q = base.where(Application.status == "rejected")

    total = (await db.execute(total_q)).scalar() or 0
    pending = (await db.execute(pending_q)).scalar() or 0
    configuring = (await db.execute(configuring_q)).scalar() or 0
    active = (await db.execute(active_q)).scalar() or 0
    rejected = (await db.execute(rejected_q)).scalar() or 0

    return SalesStats(
        total=total,
        pending=pending,
        configuring=configuring,
        active=active,
        rejected=rejected,
    )
