"""Preview Chat & Simulate — тестирование бота."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...db.models import User, Hotel
from ...db.database import get_db
from ..dependencies import get_current_user
from ...services.ai_service import ai_service
from ...services.response_processor import process_response

router = APIRouter(prefix="/preview-chat", tags=["preview"])


class PreviewRequest(BaseModel):
    message: str
    hotel_data: dict
    history: list[dict] = []


class SimulateRequest(BaseModel):
    hotel_id: int
    message: str
    history: list[dict] = []
    use_staging: bool = False  # Test staging_prompt instead of system_prompt


@router.post("")
async def preview_chat(
    data: PreviewRequest,
    current_user: User = Depends(get_current_user),
):
    """Генерировать ответ бота для превью (wizard). Требует авторизации.

    TODO(unlock-public-wizard): when opening the wizard to the public (after
    ≥3 active Ex-Machina hotels + 0 churn 30d), remove Depends(get_current_user)
    and add: IP rate-limit (20/10min), message length cap (≤500), daily IP cap,
    plus tests in backend/tests/test_preview_chat.py. Today the wizard is
    gated behind /login so the salesperson demos it during client meetings.
    """
    system_prompt = await ai_service.generate_system_prompt(data.hotel_data)

    messages = [{"role": "system", "content": system_prompt}]
    for msg in data.history[-10:]:
        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    messages.append({"role": "user", "content": data.message})

    reply, _usage = await ai_service.generate_response(
        messages=messages,
        model=data.hotel_data.get("ai_model", None),
        temperature=0.3,
        max_tokens=800,
    )

    return {"reply": reply}


@router.post("/simulate")
async def simulate_chat(
    data: SimulateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Simulate bot response for an existing hotel. Tests production or staging prompt."""
    result = await db.execute(select(Hotel).where(Hotel.id == data.hotel_id))
    hotel = result.scalar_one_or_none()
    if not hotel:
        return {"error": "Hotel not found"}
    if hotel.owner_id != current_user.id:
        return {"error": "Not authorized"}

    # Pick prompt
    prompt = hotel.staging_prompt if data.use_staging and hotel.staging_prompt else hotel.system_prompt
    if not prompt:
        return {"error": "No system prompt configured"}

    messages = [{"role": "system", "content": prompt}]
    for msg in data.history[-20:]:
        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    messages.append({"role": "user", "content": data.message})

    reply, usage = await ai_service.generate_response(
        messages=messages,
        model=hotel.ai_model,
        temperature=0.3,
        max_tokens=1000,
    )

    # Post-processing (same as real webhook)
    reply, needs_manager = process_response(reply, hotel=hotel)

    tokens = (usage.get("prompt_tokens", 0) + usage.get("completion_tokens", 0)) if usage else 0
    cost = usage.get("cost_usd", 0.0) if usage else 0.0

    return {
        "reply": reply,
        "needs_manager": needs_manager,
        "prompt_used": "staging" if data.use_staging and hotel.staging_prompt else "production",
        "tokens": tokens,
        "cost_usd": cost,
    }
