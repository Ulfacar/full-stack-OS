"""
Telegram Webhook Endpoints
Handles incoming messages from Telegram bots
"""
from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import Depends
from typing import Dict, Any
from datetime import datetime, timedelta
from ...core.config import settings
from ...db.database import get_db
from ...db.models import Hotel, Client, Conversation, Message
from ...services.telegram_service import TelegramService
from ...services.ai_service import ai_service
from ...services.budget_service import budget_service
from ...services.response_processor import process_response, check_payment_placeholder
from ...services.notification_service import NotificationService
from ...services.followup_service import schedule_followup, cancel_followup
from ...services.operator_service import (
    handle_operator_message,
    set_operator_reply_state,
)
from ...core.crypto import decrypt_token

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

    if not hotel or not hotel.is_active or hotel.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel bot not found or inactive"
        )

    # Verify Telegram secret token (mandatory)
    if not hotel.webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Webhook secret not configured"
        )
    incoming_secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
    if incoming_secret != hotel.webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid webhook secret"
        )

    # Parse Telegram update
    update: Dict[str, Any] = await request.json()

    # === #26: callback_query (manager taps inline button) ===
    if "callback_query" in update:
        return await _handle_callback_query(update["callback_query"], hotel)

    # Handle only text messages for MVP
    if "message" not in update or "text" not in update["message"]:
        return {"ok": True}

    message_data = update["message"]
    chat_id = message_data["chat"]["id"]
    user_message = message_data["text"]
    telegram_username = message_data["from"].get("username")
    telegram_id = str(message_data["from"]["id"])

    # === #26: free-text from manager → forward to client ===
    if hotel.manager_telegram_id and telegram_id == str(hotel.manager_telegram_id):
        delivered = await handle_operator_message(
            operator_tg_id=telegram_id,
            text=user_message,
            hotel=hotel,
            db=db,
        )
        return {"ok": True, "operator_forwarded": delivered}

    # Initialize Telegram service (decrypt token from DB)
    telegram = TelegramService(decrypt_token(hotel.telegram_bot_token))

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

        # Get or create/reopen conversation
        reopen_hours = hotel.reopen_window_hours or 24
        reopen_cutoff = datetime.utcnow() - timedelta(hours=reopen_hours)

        # Look for active conversation OR recently closed one (within reopen window)
        conv_result = await db.execute(
            select(Conversation).where(
                Conversation.hotel_id == hotel.id,
                Conversation.client_id == client.id,
                Conversation.status.in_(["active", "completed", "needs_operator"]),
                Conversation.updated_at >= reopen_cutoff,
            ).order_by(Conversation.created_at.desc())
        )
        conversation = conv_result.scalar_one_or_none()

        # Reopen if it was closed
        if conversation and conversation.status in ("completed", "needs_operator"):
            conversation.status = "active"
            conversation.operator_telegram_id = None
            await db.flush()

        if not conversation:
            conversation = Conversation(
                hotel_id=hotel.id,
                client_id=client.id,
                status="active",
                channel="telegram"
            )
            db.add(conversation)
            await db.flush()

        # If manager is handling — don't let AI respond, just save message
        if conversation.status == "operator_active":
            db.add(Message(conversation_id=conversation.id, role="user", content=user_message))
            await db.commit()
            # TODO: forward to manager's Telegram
            return {"ok": True}

        # Cancel pending followup — client responded
        cancel_followup(conversation.id)

        # Save user message
        user_msg = Message(
            conversation_id=conversation.id,
            role="user",
            content=user_message
        )
        db.add(user_msg)
        await db.flush()

        # First-message activation (#23) — fires exactly once per hotel.
        if hotel.activated_at is None:
            hotel.activated_at = datetime.utcnow()
            await db.flush()
            if hotel.manager_telegram_id and hotel.telegram_bot_token:
                try:
                    notifier = NotificationService(decrypt_token(hotel.telegram_bot_token))
                    client_label = client.telegram_username or client.name or telegram_id
                    await notifier.notify_first_message(
                        manager_telegram_id=hotel.manager_telegram_id,
                        hotel_name=hotel.name,
                        client_label=client_label,
                        channel="telegram",
                    )
                except Exception as e:
                    print(f"first-message notification failed: {e}")

        # Get conversation history (last 10 messages)
        history_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.desc())
            .limit(10)
        )
        history_messages = list(reversed(history_result.scalars().all()))

        # Cross-dialog memory: 10 messages from up to 3 previous conversations
        prev_convs_result = await db.execute(
            select(Conversation.id)
            .where(
                Conversation.hotel_id == hotel.id,
                Conversation.client_id == client.id,
                Conversation.id != conversation.id,
            )
            .order_by(Conversation.created_at.desc())
            .limit(3)
        )
        prev_conv_ids = [row[0] for row in prev_convs_result.all()]
        cross_dialog_messages = []
        if prev_conv_ids:
            prev_msgs_result = await db.execute(
                select(Message)
                .where(Message.conversation_id.in_(prev_conv_ids))
                .order_by(Message.created_at.desc())
                .limit(10)
            )
            cross_dialog_messages = list(reversed(prev_msgs_result.scalars().all()))

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
                "communication_style": hotel.communication_style,
                "pms_kind": hotel.pms_kind,
            }
            system_prompt = await ai_service.generate_system_prompt(hotel_data)
            hotel.system_prompt = system_prompt
            await db.flush()

        # Build messages for AI
        ai_messages = [{"role": "system", "content": hotel.system_prompt}]

        # Add cross-dialog memory (previous conversations with this client)
        if cross_dialog_messages:
            memory_text = "=== ПАМЯТЬ (предыдущие диалоги с этим гостем) ===\n"
            for msg in cross_dialog_messages:
                role_label = "Гость" if msg.role == "user" else "Бот"
                memory_text += f"{role_label}: {msg.content}\n"
            memory_text += "=== КОНЕЦ ПАМЯТИ ==="
            ai_messages.append({"role": "system", "content": memory_text})

        for msg in history_messages[:-1]:
            ai_messages.append({"role": msg.role, "content": msg.content})
        ai_messages.append({"role": "user", "content": user_message})

        # Generate AI response
        raw_response, usage = await ai_service.generate_response(
            messages=ai_messages,
            model=hotel.ai_model or None
        )

        # Post-process: clean tags, pushy questions, validate prices, detect manager transfer
        ai_response, needs_manager = process_response(raw_response, hotel=hotel)

        # Fail-loud safeguard: bot tried to quote [РЕКВИЗИТЫ] but hotel has
        # no payment_details set — skip sending to the guest and alert the
        # owner so they can fill the field.
        payment_block = check_payment_placeholder(ai_response, hotel)
        if payment_block and hotel.manager_telegram_id and hotel.telegram_bot_token:
            notifier = NotificationService(decrypt_token(hotel.telegram_bot_token))
            client_name = client.telegram_username or client.name or telegram_id
            await notifier.notify_payment_details_missing(
                manager_telegram_id=hotel.manager_telegram_id,
                hotel_name=hotel.name,
                client_name=client_name,
                channel="telegram",
                conversation_id=conversation.id,
            )
            return {"ok": True, "skipped": "payment_details_empty"}

        # Handle manager transfer
        if needs_manager and hotel.manager_telegram_id and hotel.telegram_bot_token:
            conversation.status = "needs_operator"
            await db.flush()
            notifier = NotificationService(decrypt_token(hotel.telegram_bot_token))
            client_name = client.telegram_username or client.name or telegram_id
            await notifier.notify_needs_manager(
                manager_telegram_id=hotel.manager_telegram_id,
                hotel_name=hotel.name,
                client_name=client_name,
                channel="telegram",
                conversation_id=conversation.id,
                hotel_id=hotel.id,
                last_message=user_message,
                history_url=f"{settings.FRONTEND_BASE_URL}/dashboard/hotels/{hotel.id}/conversations/{conversation.id}",
            )

        # Record AI usage with cost + debug logs
        if usage:
            # Build prompt text for debugging (system prompt + last user message)
            debug_prompt = f"[system] {hotel.system_prompt[:500]}...\n[user] {user_message}"
            await budget_service.record_usage(
                hotel_id=hotel.id,
                prompt_tokens=usage["prompt_tokens"],
                completion_tokens=usage["completion_tokens"],
                model=usage["model"],
                db=db,
                conversation_id=conversation.id,
                prompt_text=debug_prompt,
                response_text=raw_response,
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

        # Schedule followup if bot responded (not manager transfer).
        # Gated by settings.FOLLOWUP_ENABLED — in-memory task tracking races on
        # multi-replica Railway and can spam duplicate "are you still there?"
        # messages, so this is a kill-switch from env.
        if not needs_manager and settings.FOLLOWUP_ENABLED:
            await schedule_followup(
                conversation_id=conversation.id,
                hotel_id=hotel.id,
                client_channel="telegram",
                client_channel_id=str(chat_id),
                language=client.language or "ru",
            )

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


async def _handle_callback_query(callback_query: Dict[str, Any], hotel: Hotel) -> Dict[str, Any]:
    """Handle inline-button taps from the manager (`reply_<conv_id>` for #26)."""
    cb_id = callback_query.get("id")
    operator_tg_id = str(callback_query.get("from", {}).get("id", ""))
    data = callback_query.get("data", "")

    if not hotel.manager_telegram_id or operator_tg_id != str(hotel.manager_telegram_id):
        # Someone other than the registered manager tapped the button — ignore
        return {"ok": True, "ignored": "not_manager"}

    if not data.startswith("reply_"):
        return {"ok": True, "ignored": "unknown_callback"}

    try:
        conv_id = int(data.split("_", 1)[1])
    except (ValueError, IndexError):
        return {"ok": True, "ignored": "malformed_callback"}

    set_operator_reply_state(operator_tg_id, conv_id)

    if hotel.telegram_bot_token:
        notifier = NotificationService(decrypt_token(hotel.telegram_bot_token))
        await notifier.answer_callback_query(
            callback_query_id=cb_id,
            text="Пишите ответ — он уйдёт клиенту. Окно 15 мин.",
        )

    return {"ok": True, "reply_state_set": conv_id}
