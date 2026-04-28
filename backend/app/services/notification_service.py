"""
Notification Service — send alerts to hotel managers via Telegram.
"""
import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class NotificationService:
    """Send notifications to hotel managers via Telegram Bot API."""

    def __init__(self, bot_token: str):
        self.bot_token = bot_token
        self.base_url = f"https://api.telegram.org/bot{bot_token}"

    async def send_message(
        self,
        chat_id: str,
        text: str,
        parse_mode: str = "HTML",
        reply_markup: Optional[dict] = None,
    ) -> bool:
        """Send a message to a Telegram user, optionally with inline keyboard."""
        try:
            payload: dict = {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": parse_mode,
            }
            if reply_markup is not None:
                payload["reply_markup"] = reply_markup
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    f"{self.base_url}/sendMessage",
                    json=payload,
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Notification send error: {e}")
            return False

    async def notify_needs_manager(
        self,
        manager_telegram_id: str,
        hotel_name: str,
        client_name: str,
        channel: str,
        conversation_id: int,
        hotel_id: int,
        last_message: str = "",
        booking_data: Optional[dict] = None,
        history_url: Optional[str] = None,
    ) -> bool:
        """Notify manager and offer Reply / History inline buttons (#26)."""

        if booking_data:
            text = (
                f"📋 <b>ЗАЯВКА НА БРОНЬ</b>\n\n"
                f"🏨 {hotel_name}\n"
            )
            if booking_data.get("dates"):
                text += f"📅 Даты: {booking_data['dates']}\n"
            if booking_data.get("guests"):
                text += f"👥 Гостей: {booking_data['guests']}\n"
            if booking_data.get("name"):
                text += f"👤 Гость: {booking_data['name']}\n"
            if booking_data.get("phone"):
                text += f"📞 Тел: {booking_data['phone']}\n"
            text += f"📱 Канал: {channel}\n"
            text += f"\n📍 Диалог #{conversation_id}"
        else:
            text = (
                f"🔔 <b>Нужна помощь!</b>\n\n"
                f"🏨 {hotel_name}\n"
                f"👤 Гость: {client_name}\n"
                f"📱 Канал: {channel}\n"
            )
            if last_message:
                text += f"💬 Последнее: {last_message[:200]}\n"
            text += f"\n📍 Диалог #{conversation_id}"

        reply_button = {
            "text": "✍️ Ответить",
            "callback_data": f"reply_{conversation_id}",
        }
        history_button = {
            "text": "👀 История",
            "url": history_url or f"/dashboard/hotels/{hotel_id}/conversations/{conversation_id}",
        }
        reply_markup = {"inline_keyboard": [[reply_button, history_button]]}

        return await self.send_message(manager_telegram_id, text, reply_markup=reply_markup)

    async def answer_callback_query(self, callback_query_id: str, text: str = "") -> bool:
        """Acknowledge a TG callback_query so the client stops the loading spinner."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    f"{self.base_url}/answerCallbackQuery",
                    json={"callback_query_id": callback_query_id, "text": text},
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"answerCallbackQuery error: {e}")
            return False

    async def notify_payment_details_missing(
        self,
        manager_telegram_id: str,
        hotel_name: str,
        client_name: str,
        channel: str,
        conversation_id: int,
    ) -> bool:
        """Fail-loud alert: bot tried to quote payment requisites but the
        hotel has no payment_details set up in the wizard/settings. The
        guest's message was NOT sent — owner must fill the field ASAP.
        """
        text = (
            f"⚠️ <b>БОТ НЕ МОЖЕТ ОТВЕТИТЬ — нет реквизитов</b>\n\n"
            f"🏨 {hotel_name}\n"
            f"👤 Гость: {client_name}\n"
            f"📱 Канал: {channel}\n\n"
            f"Гость спросил про оплату, но у вас не заполнены реквизиты "
            f"(банковские данные / телефон / IBAN). Сообщение клиенту <b>не отправлено</b>.\n\n"
            f"Зайдите в настройки отеля и заполните раздел «Реквизиты оплаты» "
            f"— бот сразу сможет отвечать.\n\n"
            f"📍 Диалог #{conversation_id}"
        )
        return await self.send_message(manager_telegram_id, text)

    async def notify_new_hotel(
        self,
        admin_telegram_id: str,
        hotel_name: str,
        created_by: str,
    ) -> bool:
        """Notify admin about a new hotel created (by sales person)."""
        text = (
            f"🏨 <b>Новый отель создан!</b>\n\n"
            f"Название: {hotel_name}\n"
            f"Создал: {created_by}\n"
            f"Статус: демо\n\n"
            f"Зайди в админку чтобы подключить каналы."
        )
        return await self.send_message(admin_telegram_id, text)
