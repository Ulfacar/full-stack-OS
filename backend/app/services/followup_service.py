"""
Followup Service — send reminder messages when guest stops responding.
10 min → first followup, 15 min later → second followup. Max 2.
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.models import Conversation, Message, Hotel, Client
from ..db.database import AsyncSessionLocal
from .telegram_service import TelegramService
from ..core.crypto import decrypt_token

logger = logging.getLogger(__name__)

# Followup texts per language
FOLLOWUP_TEXTS = {
    "ru": [
        "Вы ещё с нами? Если остались вопросы — с радостью помогу! 😊",
        "Если будут вопросы — пишите в любое время. Будем рады помочь! 🏨",
    ],
    "en": [
        "Are you still there? If you have any questions — I'm happy to help! 😊",
        "Feel free to reach out anytime. We'll be glad to help! 🏨",
    ],
    "ky": [
        "Сиз дагы эле биздесизби? Суроолоруңуз болсо — жардам берүүгө даярмын! 😊",
        "Суроолоруңуз болсо — каалаган убакта жазыңыз! 🏨",
    ],
}

# Active followup tasks: conversation_id → asyncio.Task
_followup_tasks: dict[int, asyncio.Task] = {}


async def schedule_followup(
    conversation_id: int,
    hotel_id: int,
    client_channel: str,  # "telegram" or "whatsapp"
    client_channel_id: str,  # telegram chat_id or whatsapp phone
    language: str = "ru",
):
    """Schedule followup messages for a conversation."""
    # Cancel existing followup for this conversation
    old_task = _followup_tasks.get(conversation_id)
    if old_task and not old_task.done():
        old_task.cancel()

    task = asyncio.create_task(
        _followup_worker(conversation_id, hotel_id, client_channel, client_channel_id, language)
    )
    _followup_tasks[conversation_id] = task


def cancel_followup(conversation_id: int):
    """Cancel scheduled followup (client responded)."""
    task = _followup_tasks.pop(conversation_id, None)
    if task and not task.done():
        task.cancel()


async def _followup_worker(
    conversation_id: int,
    hotel_id: int,
    client_channel: str,
    client_channel_id: str,
    language: str,
):
    """Worker that sends 2 followup messages with delays."""
    texts = FOLLOWUP_TEXTS.get(language, FOLLOWUP_TEXTS["ru"])
    delays = [600, 900]  # 10 min, then 15 min

    for i, (delay, text) in enumerate(zip(delays, texts)):
        await asyncio.sleep(delay)

        # Check if client responded since we scheduled
        async with AsyncSessionLocal() as db:
            last_msg = await db.execute(
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.created_at.desc())
                .limit(1)
            )
            msg = last_msg.scalar_one_or_none()

            # If last message is from user or operator — don't followup
            if msg and msg.role in ("user", "operator"):
                return

            # Check conversation still active
            conv = await db.get(Conversation, conversation_id)
            if not conv or conv.status not in ("active",):
                return

            # Get hotel for bot token
            hotel = await db.get(Hotel, hotel_id)
            if not hotel or not hotel.telegram_bot_token:
                return

            # Send followup
            if client_channel == "telegram":
                tg = TelegramService(decrypt_token(hotel.telegram_bot_token))
                await tg.send_message(chat_id=int(client_channel_id), text=text)

            # Save followup as bot message
            followup_msg = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=text,
            )
            db.add(followup_msg)
            await db.commit()

            logger.info(f"Followup #{i+1} sent for conversation {conversation_id}")
