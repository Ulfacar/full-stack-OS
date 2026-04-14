"""
Telegram Webhook Endpoints
Handles incoming messages from Telegram bots
"""
from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import Depends
from typing import Dict, Any
from ...db.database import get_db
from ...db.models import Hotel, Client, Conversation, Message
from ...services.telegram_service import TelegramService
from ...services.ai_service import ai_service
from ...services.budget_service import budget_service

router = APIRouter(prefix="/webhooks/telegram", tags=["webhooks"])


@router.post("/{hotel_slug}")
async def telegram_webhook(
    hotel_slug: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Receive Telegram webhook updates for specific hotel bot."""
    # Get hotel by slug
    result = await db.execute(select(Hotel).where(Hotel.slug == hotel_slug))
    hotel = result.scalar_one_or_none()

    if not hotel or not hotel.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel bot not found or inactive"
        )

    # Parse Telegram update
    update: Dict[str, Any] = await request.json()

    # Handle only text messages for MVP
    if "message" not in update or "text" not in update["message"]:
        return {"ok": True}

    message_data = update["message"]
    chat_id = message_data["chat"]["id"]
    user_message = message_data["text"]
    telegram_username = message_data["from"].get("username")
    telegram_id = str(message_data["from"]["id"])

    # Initialize Telegram service
    telegram = TelegramService(hotel.telegram_bot_token)

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
        await telegram.send_message(chat_id=chat_id, text=fallback)
        return {"ok": True}

    # Send typing indicator
    await telegram.send_chat_action(chat_id, "typing")

    try:
        # Get or create client
        client_result = await db.execute(
            select(Client).where(
                Client.hotel_id == hotel.id,
                Client.telegram_id == telegram_id
            )
        )
        client = client_result.scalar_one_or_none()

        if not client:
            client = Client(
                hotel_id=hotel.id,
                telegram_id=telegram_id,
                telegram_username=telegram_username,
                language="ru"
            )
            db.add(client)
            await db.flush()

        # Get or create active conversation
        conv_result = await db.execute(
            select(Conversation).where(
                Conversation.hotel_id == hotel.id,
                Conversation.client_id == client.id,
                Conversation.status == "active"
            ).order_by(Conversation.created_at.desc())
        )
        conversation = conv_result.scalar_one_or_none()

        if not conversation:
            conversation = Conversation(
                hotel_id=hotel.id,
                client_id=client.id,
                status="active",
                channel="telegram"
            )
            db.add(conversation)
            await db.flush()

        # Save user message
        user_msg = Message(
            conversation_id=conversation.id,
            role="user",
            content=user_message
        )
        db.add(user_msg)
        await db.flush()

        # Get conversation history (last 10 messages)
        history_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.desc())
            .limit(10)
        )
        history_messages = list(reversed(history_result.scalars().all()))

        # Generate system prompt if not exists
        if not hotel.system_prompt:
            hotel_data = {
                "name": hotel.name,
                "description": hotel.description,
                "address": hotel.address,
                "phone": hotel.phone,
                "email": hotel.email,
                "website": hotel.website,
                "rooms": hotel.rooms,
                "rules": hotel.rules,
                "amenities": hotel.amenities,
                "communication_style": hotel.communication_style
            }
            system_prompt = await ai_service.generate_system_prompt(hotel_data)
            hotel.system_prompt = system_prompt
            await db.flush()

        # Build messages for AI
        ai_messages = [{"role": "system", "content": hotel.system_prompt}]
        for msg in history_messages[:-1]:
            ai_messages.append({"role": msg.role, "content": msg.content})
        ai_messages.append({"role": "user", "content": user_message})

        # Generate AI response
        ai_response, usage = await ai_service.generate_response(
            messages=ai_messages,
            model=hotel.ai_model or None
        )

        # Record AI usage with cost
        if usage:
            await budget_service.record_usage(
                hotel_id=hotel.id,
                prompt_tokens=usage["prompt_tokens"],
                completion_tokens=usage["completion_tokens"],
                model=usage["model"],
                db=db,
                conversation_id=conversation.id,
            )

        # Save AI response
        assistant_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=ai_response
        )
        db.add(assistant_msg)
        await db.commit()

        # Send response to Telegram
        await telegram.send_message(chat_id=chat_id, text=ai_response)

        return {"ok": True}

    except Exception as e:
        print(f"Webhook error: {e}")
        await db.rollback()

        try:
            await telegram.send_message(
                chat_id=chat_id,
                text="Извините, произошла ошибка. Пожалуйста, попробуйте позже."
            )
        except:
            pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
