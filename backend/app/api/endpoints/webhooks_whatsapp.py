"""WhatsApp Webhook — supports both wappi.pro and Meta Cloud API."""

import hashlib
import hmac
import logging
import httpx
from fastapi import APIRouter, HTTPException, Request, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.config import settings
from ...db.database import get_db
from ...db.models import Hotel, Client, Conversation, Message
from ...services.ai_service import ai_service
from ...services.budget_service import budget_service
from ...services.response_processor import process_response, check_payment_placeholder
from ...services.meta_whatsapp_service import send_meta_whatsapp, parse_meta_webhook
from ...core.crypto import decrypt_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/whatsapp", tags=["webhooks"])


# === WAPPI.PRO ===

async def _send_wappi(api_key: str, profile_id: str, recipient: str, text: str) -> bool:
    """Send message via wappi.pro."""
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
        logger.error(f"Wappi send error: {e}")
        return False


# === SHARED LOGIC ===

async def _handle_whatsapp_message(
    hotel: Hotel,
    sender: str,
    name: str,
    text: str,
    db: AsyncSession,
):
    """Process WhatsApp message from any provider."""

    # Budget check
    has_budget, remaining = await budget_service.check_budget(hotel.id, db)
    if not has_budget:
        fallback = "Спасибо за обращение! Бот временно недоступен."
        if hotel.phone:
            fallback += f" Свяжитесь с отелем: {hotel.phone}"
        await _send_reply(hotel, sender, fallback)
        return

    # Client
    client_result = await db.execute(
        select(Client).where(Client.hotel_id == hotel.id, Client.whatsapp_phone == sender)
    )
    client = client_result.scalar_one_or_none()

    if not client:
        client = Client(hotel_id=hotel.id, whatsapp_phone=sender, name=name or sender, language="ru")
        db.add(client)
        await db.flush()

    # Conversation
    conv_result = await db.execute(
        select(Conversation).where(
            Conversation.hotel_id == hotel.id,
            Conversation.client_id == client.id,
            Conversation.status == "active",
        ).order_by(Conversation.created_at.desc())
    )
    conversation = conv_result.scalar_one_or_none()

    if not conversation:
        conversation = Conversation(hotel_id=hotel.id, client_id=client.id, status="active", channel="whatsapp")
        db.add(conversation)
        await db.flush()

    # If operator active — skip AI
    if conversation.status == "operator_active":
        db.add(Message(conversation_id=conversation.id, role="user", content=text))
        await db.commit()
        return

    # Save message
    db.add(Message(conversation_id=conversation.id, role="user", content=text))
    await db.flush()

    # History
    history_result = await db.execute(
        select(Message).where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.desc()).limit(10)
    )
    history = list(reversed(history_result.scalars().all()))

    # System prompt
    if not hotel.system_prompt:
        hotel.system_prompt = await ai_service.generate_system_prompt({
            "name": hotel.name, "description": hotel.description,
            "address": hotel.address, "phone": hotel.phone,
            "rooms": hotel.rooms, "rules": hotel.rules,
            "amenities": hotel.amenities,
            "communication_style": hotel.communication_style or "friendly",
        })
        await db.flush()

    # AI
    ai_messages = [{"role": "system", "content": hotel.system_prompt}]
    for msg in history[:-1]:
        ai_messages.append({"role": msg.role, "content": msg.content})
    ai_messages.append({"role": "user", "content": text})

    raw_response, usage = await ai_service.generate_response(
        messages=ai_messages, model=hotel.ai_model or None, temperature=0.3,
    )

    ai_response, needs_manager = process_response(raw_response, hotel=hotel)

    # Fail-loud safeguard: bot tried to quote [РЕКВИЗИТЫ] but hotel has no
    # payment_details filled — alert owner, drop the outgoing message.
    payment_block = check_payment_placeholder(ai_response, hotel)
    if payment_block and hotel.manager_telegram_id and hotel.telegram_bot_token:
        from ...services.notification_service import NotificationService
        notifier = NotificationService(decrypt_token(hotel.telegram_bot_token))
        await notifier.notify_payment_details_missing(
            manager_telegram_id=hotel.manager_telegram_id,
            hotel_name=hotel.name,
            client_name=name or sender,
            channel="whatsapp",
            conversation_id=conversation.id,
        )
        return

    # Record usage
    if usage:
        await budget_service.record_usage(
            hotel_id=hotel.id, prompt_tokens=usage["prompt_tokens"],
            completion_tokens=usage["completion_tokens"], model=usage["model"],
            db=db, conversation_id=conversation.id,
        )

    # Handle manager transfer
    if needs_manager and hotel.manager_telegram_id and hotel.telegram_bot_token:
        conversation.status = "needs_operator"
        from ...services.notification_service import NotificationService
        notifier = NotificationService(decrypt_token(hotel.telegram_bot_token))
        await notifier.notify_needs_manager(
            manager_telegram_id=hotel.manager_telegram_id,
            hotel_name=hotel.name, client_name=name or sender,
            channel="whatsapp", conversation_id=conversation.id,
            hotel_id=hotel.id,
            last_message=text,
            history_url=f"{settings.FRONTEND_BASE_URL}/dashboard/hotels/{hotel.id}/conversations/{conversation.id}",
        )

    # Save response
    db.add(Message(conversation_id=conversation.id, role="assistant", content=ai_response))
    await db.commit()

    # Send reply
    await send_whatsapp_reply(hotel, sender, ai_response)


async def send_whatsapp_reply(hotel: Hotel, recipient: str, text: str):
    """Send reply via the configured WhatsApp provider (wappi.pro / Meta).

    Public so other modules (e.g. operator_service for #26) can deliver
    operator-typed responses to clients via WA without re-implementing the
    provider routing.
    """
    provider = hotel.whatsapp_provider or "wappi"

    if provider == "meta" and hotel.meta_access_token and hotel.meta_phone_number_id:
        await send_meta_whatsapp(
            access_token=decrypt_token(hotel.meta_access_token),
            phone_number_id=hotel.meta_phone_number_id,
            recipient=recipient,
            text=text,
        )
    elif hotel.wappi_api_key and hotel.wappi_profile_id:
        await _send_wappi(
            api_key=decrypt_token(hotel.wappi_api_key),
            profile_id=hotel.wappi_profile_id,
            recipient=recipient,
            text=text,
        )


# === WAPPI.PRO WEBHOOK ===

@router.post("/{hotel_slug}")
async def whatsapp_webhook(
    hotel_slug: str,
    request: Request,
    secret: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Receive WhatsApp messages via wappi.pro webhook."""
    result = await db.execute(
        select(Hotel).where(Hotel.slug == hotel_slug, Hotel.is_active == True, Hotel.status != "suspended")
    )
    hotel = result.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    # Verify webhook secret (mandatory)
    if not hotel.webhook_secret:
        raise HTTPException(status_code=403, detail="Webhook secret not configured")
    if secret != hotel.webhook_secret:
        raise HTTPException(status_code=403, detail="Invalid webhook secret")

    data = await request.json()
    messages = data.get("messages", {})

    if messages.get("wh_type") in ("delivery_status", "ack"):
        return {"ok": True}

    text = messages.get("body", "")
    if not text:
        return {"ok": True}

    sender = messages.get("chat_id", "").replace("@c.us", "")
    name = messages.get("senderName", "")
    if not sender:
        return {"ok": True}

    try:
        await _handle_whatsapp_message(hotel, sender, name, text, db)
    except Exception as e:
        logger.error(f"Wappi webhook error: {e}")
        await db.rollback()

    return {"ok": True}


# === META CLOUD API WEBHOOK ===

@router.get("/meta/{hotel_slug}")
async def meta_webhook_verify(
    hotel_slug: str,
    mode: str = Query(None, alias="hub.mode"),
    token: str = Query(None, alias="hub.verify_token"),
    challenge: str = Query(None, alias="hub.challenge"),
    db: AsyncSession = Depends(get_db),
):
    """Meta webhook verification (GET request)."""
    # Use webhook_secret as verify token (not the public slug)
    result = await db.execute(select(Hotel).where(Hotel.slug == hotel_slug))
    hotel = result.scalar_one_or_none()
    if not hotel or not hotel.webhook_secret:
        raise HTTPException(status_code=403, detail="Verification failed")

    if mode == "subscribe" and token == hotel.webhook_secret:
        return int(challenge) if challenge else ""
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/meta/{hotel_slug}")
async def meta_webhook(
    hotel_slug: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Receive WhatsApp messages via Meta Cloud API webhook."""
    result = await db.execute(
        select(Hotel).where(Hotel.slug == hotel_slug, Hotel.is_active == True, Hotel.status != "suspended")
    )
    hotel = result.scalar_one_or_none()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    # Verify Meta X-Hub-Signature-256 (mandatory)
    if not hotel.meta_app_secret:
        raise HTTPException(status_code=403, detail="Meta app secret not configured")
    signature = request.headers.get("X-Hub-Signature-256", "")
    body = await request.body()
    app_secret = decrypt_token(hotel.meta_app_secret)
    expected = "sha256=" + hmac.HMAC(
        app_secret.encode(), body, hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=403, detail="Invalid signature")

    data = await request.json()
    parsed = parse_meta_webhook(data)
    if not parsed:
        return {"ok": True}

    try:
        await _handle_whatsapp_message(hotel, parsed["sender"], parsed["name"], parsed["text"], db)
    except Exception as e:
        logger.error(f"Meta webhook error: {e}")
        await db.rollback()

    return {"ok": True}
