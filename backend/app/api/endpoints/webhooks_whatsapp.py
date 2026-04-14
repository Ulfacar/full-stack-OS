"""WhatsApp Webhook (wappi.pro) — приём сообщений из WhatsApp."""

import logging
import httpx
from fastapi import APIRouter, HTTPException, Request, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.database import get_db
from ...db.models import Hotel, Client, Conversation, Message
from ...services.ai_service import ai_service
from ...services.budget_service import budget_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/whatsapp", tags=["webhooks"])


async def _send_whatsapp(api_key: str, profile_id: str, recipient: str, text: str) -> bool:
    """Отправить сообщение через wappi.pro."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                "https://wappi.pro/api/sync/message/send",
                headers={"Authorization": api_key},
                params={"profile_id": profile_id},
                json={"body": text, "recipient": recipient},
            )
        return response.status_code == 200
    except Exception as e:
        logger.error(f"WhatsApp send error: {e}")
        return False


@router.post("/{hotel_slug}")
async def whatsapp_webhook(
    hotel_slug: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Приём WhatsApp сообщений через wappi.pro webhook."""
    result = await db.execute(
        select(Hotel).where(
            Hotel.slug == hotel_slug,
            Hotel.is_active == True,
            Hotel.status != "suspended",
        )
    )
    hotel = result.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    data = await request.json()
    messages = data.get("messages", {})

    # Игнорируем статусы доставки
    if messages.get("wh_type") in ("delivery_status", "ack"):
        return {"ok": True}

    text = messages.get("body", "")
    if not text:
        return {"ok": True}

    sender = messages.get("chat_id", "").replace("@c.us", "")
    name = messages.get("senderName", "")
    if not sender:
        return {"ok": True}

    # Budget check BEFORE processing
    has_budget, remaining = await budget_service.check_budget(hotel.id, db)
    if not has_budget:
        fallback = (
            f"Спасибо за обращение! К сожалению, бот временно недоступен. "
            f"Пожалуйста, свяжитесь с отелем напрямую"
        )
        if hotel.phone:
            fallback += f": {hotel.phone}"
        else:
            fallback += "."
        if hotel.whatsapp_phone:
            await _send_whatsapp(
                api_key=hotel.whatsapp_phone,
                profile_id="",
                recipient=sender,
                text=fallback,
            )
        return {"ok": True}

    try:
        # Клиент
        client_result = await db.execute(
            select(Client).where(
                Client.hotel_id == hotel.id,
                Client.whatsapp_phone == sender,
            )
        )
        client = client_result.scalar_one_or_none()

        if not client:
            client = Client(
                hotel_id=hotel.id,
                whatsapp_phone=sender,
                name=name or sender,
                language="ru",
            )
            db.add(client)
            await db.flush()

        # Диалог
        conv_result = await db.execute(
            select(Conversation).where(
                Conversation.hotel_id == hotel.id,
                Conversation.client_id == client.id,
                Conversation.status == "active",
            ).order_by(Conversation.created_at.desc())
        )
        conversation = conv_result.scalar_one_or_none()

        if not conversation:
            conversation = Conversation(
                hotel_id=hotel.id,
                client_id=client.id,
                status="active",
                channel="whatsapp",
            )
            db.add(conversation)
            await db.flush()

        # Сохраняем сообщение
        db.add(Message(conversation_id=conversation.id, role="user", content=text))
        await db.flush()

        # История
        history_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.desc())
            .limit(10)
        )
        history = list(reversed(history_result.scalars().all()))

        # System prompt
        if not hotel.system_prompt:
            hotel.system_prompt = await ai_service.generate_system_prompt({
                "name": hotel.name, "description": hotel.description,
                "address": hotel.address, "phone": hotel.phone,
                "rooms": hotel.rooms, "rules": hotel.rules,
                "amenities": hotel.amenities,
            })
            await db.flush()

        # AI
        ai_messages = [{"role": "system", "content": hotel.system_prompt}]
        for msg in history[:-1]:
            ai_messages.append({"role": msg.role, "content": msg.content})
        ai_messages.append({"role": "user", "content": text})

        ai_response, usage = await ai_service.generate_response(
            messages=ai_messages,
            model=hotel.ai_model or None,
            temperature=0.3,
        )

        # Record usage
        if usage:
            await budget_service.record_usage(
                hotel_id=hotel.id,
                prompt_tokens=usage["prompt_tokens"],
                completion_tokens=usage["completion_tokens"],
                model=usage["model"],
                db=db,
                conversation_id=conversation.id,
            )

        # Сохраняем ответ
        db.add(Message(conversation_id=conversation.id, role="assistant", content=ai_response))
        await db.commit()

        # Отправляем через wappi
        if hotel.whatsapp_phone:
            await _send_whatsapp(
                api_key=hotel.whatsapp_phone,
                profile_id="",
                recipient=sender,
                text=ai_response,
            )

        return {"ok": True}

    except Exception as e:
        logger.error(f"WhatsApp webhook error: {e}")
        await db.rollback()
        return {"ok": True}
