"""
Operator Reply Service — two-way TG manager ↔ TG/WA client channel (#26).

Flow:
1. notify_needs_manager sends inline `[✍️ Ответить] [👀 История]` to manager
2. Manager taps Ответить → callback_query → set_operator_reply_state
3. Manager writes free text → webhook detects from.id == manager_telegram_id →
   handle_operator_message → forward to client via their channel

WARNING: state is in-memory dict. Will not survive process restart and breaks
under multi-replica autoscaling. Migrate to Redis when Railway autoscale is on
or 5+ active hotels exist (Trello: RB8NF6OV).
"""
from __future__ import annotations

import logging
import time
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.crypto import decrypt_token
from ..db.models import Client, Conversation, Hotel, Message
from .telegram_service import TelegramService

logger = logging.getLogger(__name__)

STATE_TTL_SECONDS = 15 * 60  # 15 minutes per #26 AC

# operator_telegram_id (str) -> {conversation_id: int, expires_at: float}
_state: dict[str, dict] = {}


def set_operator_reply_state(operator_tg_id: str, conversation_id: int) -> None:
    """Mark the operator as actively replying to a given conversation."""
    _state[str(operator_tg_id)] = {
        "conversation_id": conversation_id,
        "expires_at": time.time() + STATE_TTL_SECONDS,
    }


def get_active_conversation_id(operator_tg_id: str) -> Optional[int]:
    """Return the conversation the operator is currently replying to, if any."""
    entry = _state.get(str(operator_tg_id))
    if not entry:
        return None
    if time.time() > entry["expires_at"]:
        _state.pop(str(operator_tg_id), None)
        return None
    return entry["conversation_id"]


def clear_operator_reply_state(operator_tg_id: str) -> None:
    _state.pop(str(operator_tg_id), None)


def _reset_state_for_tests() -> None:
    """Test helper — wipe module-level state between tests."""
    _state.clear()


async def handle_operator_message(
    operator_tg_id: str,
    text: str,
    hotel: Hotel,
    db: AsyncSession,
) -> bool:
    """Persist operator message and forward to client. Returns True on delivery.

    No active state → log warning and ignore (Winston default — manager
    multi-conv menu is a separate Backlog story).
    """
    conv_id = get_active_conversation_id(operator_tg_id)
    if conv_id is None:
        logger.warning(
            "Operator %s sent message without active reply state — ignored",
            operator_tg_id,
        )
        return False

    conv_result = await db.execute(
        select(Conversation).where(Conversation.id == conv_id)
    )
    conversation = conv_result.scalar_one_or_none()
    if conversation is None or conversation.hotel_id != hotel.id:
        logger.warning(
            "Operator %s state pointed to conv %s outside hotel %s — cleared",
            operator_tg_id, conv_id, hotel.id,
        )
        clear_operator_reply_state(operator_tg_id)
        return False

    client_result = await db.execute(
        select(Client).where(Client.id == conversation.client_id)
    )
    client = client_result.scalar_one_or_none()
    if client is None:
        logger.error("Conversation %s has no client (data corruption?)", conv_id)
        return False

    db.add(Message(
        conversation_id=conv_id,
        role="user",          # OpenAI semantic
        sender="operator",    # business semantic for admin UI
        content=text,
    ))
    conversation.assigned_user_id = hotel.owner_id
    conversation.operator_telegram_id = str(operator_tg_id)
    conversation.status = "operator_active"
    conversation.last_message_preview = text[:500]
    await db.commit()

    return await deliver_operator_message_to_client(hotel, conversation, client, text)


async def deliver_operator_message_to_client(
    hotel: Hotel,
    conversation: Conversation,
    client: Client,
    text: str,
) -> bool:
    """Send operator-typed text to the client via the conversation's channel.

    Public so admin-panel POST /operator-reply (#26 M2) can reuse it without
    duplicating the TG/WA dispatch logic.
    """
    if conversation.channel == "telegram":
        if not client.telegram_id or not hotel.telegram_bot_token:
            logger.error(
                "Cannot send TG to client %s: missing telegram_id or bot token",
                client.id,
            )
            return False
        tg = TelegramService(decrypt_token(hotel.telegram_bot_token))
        result = await tg.send_message(chat_id=int(client.telegram_id), text=text)
        return bool(result.get("ok"))

    if conversation.channel == "whatsapp":
        # Lazy import — webhooks_whatsapp imports services, avoid circularity
        from ..api.endpoints.webhooks_whatsapp import send_whatsapp_reply
        if not client.whatsapp_phone:
            logger.error("Cannot send WA to client %s: missing phone", client.id)
            return False
        await send_whatsapp_reply(hotel, client.whatsapp_phone, text)
        return True

    logger.error(
        "Unknown channel %r for conv %s — cannot deliver",
        conversation.channel, conversation.id,
    )
    return False
