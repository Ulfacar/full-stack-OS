"""Preview Chat — мини-чат для тестирования бота при создании отеля."""

from fastapi import APIRouter
from pydantic import BaseModel

from ...services.ai_service import ai_service

router = APIRouter(prefix="/preview-chat", tags=["preview"])


class PreviewRequest(BaseModel):
    message: str
    hotel_data: dict  # Данные из формы визарда
    history: list[dict] = []  # Предыдущие сообщения в превью


@router.post("")
async def preview_chat(data: PreviewRequest):
    """Генерировать ответ бота для превью (без сохранения в БД, без проверки бюджета)."""
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
