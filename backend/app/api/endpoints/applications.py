"""Applications — публичная подача заявок + управление в admin."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from ...db.database import get_db
from ...db.models import Application, Hotel, User
from ..dependencies import get_current_user
from ...services.ai_service import ai_service

router = APIRouter(tags=["applications"])


# --- Schemas ---

class ApplicationCreate(BaseModel):
    hotel_name: str
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    form_data: dict


class ApplicationOut(BaseModel):
    id: int
    status: str
    hotel_name: str
    contact_name: Optional[str]
    contact_phone: Optional[str]
    contact_email: Optional[str]
    form_data: Optional[dict]
    generated_prompt: Optional[str]
    hotel_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ActivateRequest(BaseModel):
    slug: str
    telegram_bot_token: Optional[str] = None
    whatsapp_phone: Optional[str] = None
    ai_model: str = "anthropic/claude-3.5-haiku"


# --- Публичный endpoint (без авторизации) ---

@router.post("/applications", response_model=ApplicationOut, status_code=201)
async def submit_application(
    data: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Клиент отправляет заявку с данными отеля (публичный, без логина)."""
    # Генерируем промпт из form_data
    generated_prompt = await ai_service.generate_system_prompt(data.form_data)

    app = Application(
        hotel_name=data.hotel_name,
        contact_name=data.contact_name,
        contact_phone=data.contact_phone,
        contact_email=data.contact_email,
        form_data=data.form_data,
        generated_prompt=generated_prompt,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return app


# --- Admin endpoints (с авторизацией) ---

@router.get("/admin/applications", response_model=List[ApplicationOut])
async def list_applications(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Список заявок для дашборда (admin only)."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    query = select(Application).order_by(Application.created_at.desc())
    if status:
        query = query.where(Application.status == status)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/admin/applications/{app_id}", response_model=ApplicationOut)
async def get_application(
    app_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Детали заявки (admin only)."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.patch("/admin/applications/{app_id}", response_model=ApplicationOut)
async def update_application(
    app_id: int,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Обновить статус заявки (admin only)."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if status:
        app.status = status
    await db.commit()
    await db.refresh(app)
    return app


@router.post("/admin/applications/{app_id}/activate", response_model=dict)
async def activate_application(
    app_id: int,
    data: ActivateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Активировать заявку — создать отель и запустить бота (admin only)."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status == "active":
        raise HTTPException(status_code=400, detail="Already activated")

    # Проверяем уникальность slug
    existing = await db.execute(select(Hotel).where(Hotel.slug == data.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Slug already in use")

    # Создаём отель из заявки
    import secrets as _secrets
    form = app.form_data or {}
    hotel = Hotel(
        owner_id=user.id,
        name=app.hotel_name,
        slug=data.slug,
        address=form.get("address"),
        phone=app.contact_phone,
        email=app.contact_email,
        description=form.get("description"),
        telegram_bot_token=data.telegram_bot_token,
        whatsapp_phone=data.whatsapp_phone,
        ai_model=data.ai_model,
        system_prompt=app.generated_prompt,
        rooms=form.get("rooms"),
        rules=form.get("rules"),
        amenities=form.get("amenities"),
        communication_style=form.get("communication_style", "friendly"),
        languages=form.get("languages", ["ru"]),
        is_active=True,
        webhook_secret=_secrets.token_hex(32),
    )
    db.add(hotel)
    await db.flush()

    # Связываем заявку с отелем
    app.hotel_id = hotel.id
    app.status = "active"

    await db.commit()

    return {
        "hotel_id": hotel.id,
        "slug": hotel.slug,
        "status": "activated",
        "webhook_telegram": f"/webhooks/telegram/{hotel.slug}",
        "webhook_whatsapp": f"/webhooks/whatsapp/{hotel.slug}",
    }
