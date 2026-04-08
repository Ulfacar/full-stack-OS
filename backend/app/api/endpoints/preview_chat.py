"""Preview Chat — мини-чат для тестирования бота при создании отеля."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.database import get_db
from ...services.ai_service import ai_service

router = APIRouter(prefix="/preview-chat", tags=["preview"])


class PreviewRequest(BaseModel):
    message: str
    hotel_data: dict  # Данные из формы визарда
    history: list[dict] = []  # Предыдущие сообщения в превью


@router.post("")
async def preview_chat(data: PreviewRequest):
    """Генерировать ответ бота для превью (без сохранения в БД)."""
    system_prompt = await ai_service.generate_system_prompt(data.hotel_data)

    messages = [{"role": "system", "content": system_prompt}]
    for msg in data.history[-10:]:  # Макс 10 сообщений истории
        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    messages.append({"role": "user", "content": data.message})

    reply = await ai_service.generate_response(
        messages=messages,
        model=data.hotel_data.get("ai_model", "anthropic/claude-3.5-haiku"),
        temperature=0.3,
        max_tokens=800,
    )

    return {"reply": reply}
