"""
Telegram Bot Service
Handles Telegram Bot API interactions, webhook registration, and message sending
"""
import httpx
from typing import Optional, Dict, Any


class TelegramService:
    """Service for Telegram Bot API operations"""

    def __init__(self, bot_token: str):
        """
        Initialize Telegram service with bot token

        Args:
            bot_token: Telegram bot token from @BotFather
        """
        self.bot_token = bot_token
        self.api_base = f"https://api.telegram.org/bot{bot_token}"

    async def set_webhook(self, webhook_url: str) -> Dict[str, Any]:
        """
        Register webhook URL for receiving messages

        Args:
            webhook_url: Public HTTPS URL where Telegram will send updates

        Returns:
            API response dict
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_base}/setWebhook",
                json={"url": webhook_url}
            )
            return response.json()

    async def delete_webhook(self) -> Dict[str, Any]:
        """
        Remove webhook registration

        Returns:
            API response dict
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.api_base}/deleteWebhook")
            return response.json()

    async def get_webhook_info(self) -> Dict[str, Any]:
        """
        Get current webhook status

        Returns:
            Webhook info dict
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.api_base}/getWebhookInfo")
            return response.json()

    async def send_message(
        self,
        chat_id: int,
        text: str,
        parse_mode: Optional[str] = None,
        reply_to_message_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Send text message to user

        Args:
            chat_id: Telegram chat ID
            text: Message text
            parse_mode: Optional formatting mode ("Markdown" or "HTML")
            reply_to_message_id: Optional message ID to reply to

        Returns:
            API response dict
        """
        payload = {
            "chat_id": chat_id,
            "text": text
        }

        if parse_mode:
            payload["parse_mode"] = parse_mode

        if reply_to_message_id:
            payload["reply_to_message_id"] = reply_to_message_id

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_base}/sendMessage",
                json=payload
            )
            return response.json()

    async def send_chat_action(self, chat_id: int, action: str = "typing") -> Dict[str, Any]:
        """
        Send chat action (e.g., typing indicator)

        Args:
            chat_id: Telegram chat ID
            action: Action type (typing, upload_photo, etc.)

        Returns:
            API response dict
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_base}/sendChatAction",
                json={"chat_id": chat_id, "action": action}
            )
            return response.json()

    async def get_me(self) -> Dict[str, Any]:
        """
        Get bot info (useful for validating token)

        Returns:
            Bot info dict
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.api_base}/getMe")
            return response.json()

    @staticmethod
    async def validate_bot_token(bot_token: str) -> bool:
        """
        Check if bot token is valid by calling getMe

        Args:
            bot_token: Telegram bot token to validate

        Returns:
            True if token is valid, False otherwise
        """
        try:
            service = TelegramService(bot_token)
            result = await service.get_me()
            return result.get("ok", False)
        except Exception:
            return False
