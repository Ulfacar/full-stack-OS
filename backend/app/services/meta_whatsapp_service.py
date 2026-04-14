"""
Meta WhatsApp Cloud API Service — send/receive messages via official Meta API.
"""
import logging
import httpx
from typing import Optional

logger = logging.getLogger(__name__)

META_API_URL = "https://graph.facebook.com/v18.0"


async def send_meta_whatsapp(
    access_token: str,
    phone_number_id: str,
    recipient: str,
    text: str,
) -> bool:
    """Send a text message via Meta WhatsApp Cloud API."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                f"{META_API_URL}/{phone_number_id}/messages",
                headers={"Authorization": f"Bearer {access_token}"},
                json={
                    "messaging_product": "whatsapp",
                    "to": recipient,
                    "type": "text",
                    "text": {"body": text},
                },
            )
            if response.status_code == 200:
                return True
            else:
                logger.error(f"Meta WA send error: {response.status_code} {response.text}")
                return False
    except Exception as e:
        logger.error(f"Meta WA send exception: {e}")
        return False


def parse_meta_webhook(data: dict) -> Optional[dict]:
    """
    Parse incoming Meta webhook payload.
    Returns dict with {sender, text, name} or None if not a text message.
    """
    try:
        entry = data.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])

        if not messages:
            return None

        msg = messages[0]
        if msg.get("type") != "text":
            return None

        # Get sender info
        sender = msg.get("from", "")
        text = msg.get("text", {}).get("body", "")

        # Get profile name
        contacts = value.get("contacts", [{}])
        name = contacts[0].get("profile", {}).get("name", "") if contacts else ""

        if not sender or not text:
            return None

        return {
            "sender": sender,
            "text": text,
            "name": name,
        }
    except (IndexError, KeyError) as e:
        logger.error(f"Meta webhook parse error: {e}")
        return None
