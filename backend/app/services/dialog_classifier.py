"""Dialog topic classifier.

Classifies a finished (or abandoned) conversation into one of four topic
buckets using a cheap LLM. The result goes into `Conversation.category`
(see migration 014) and drives the admin panel filters plus the monthly
ROI report (#33 — only `booking` dialogs contribute $ saved).

Why a separate module: the classification has its own prompt, a different
model, and runs on a different trigger (post-hoc after followup, not
inline with the user-facing reply). Keeping it out of `ai_service` keeps
that class focused on the user-facing generation loop.

Source for the four categories: Ton Azure admin panel (Playwright recon
2026-04-21) — owners there sort dialogs as «Бронирование / Общий / Номера»
plus a service bucket we add for future SPA/restaurant questions.
"""
from __future__ import annotations

import logging
import re
from typing import Optional, Protocol

logger = logging.getLogger(__name__)


CATEGORIES: tuple[str, ...] = ("booking", "general", "rooms", "service")

# Budget for the classifier call. gpt-4o-mini at $0.15 / $0.6 per 1M tokens
# costs ~$0.00003 per dialog (small tail of history, 10 output tokens). This
# is roughly 20× cheaper than the main response generator.
CLASSIFIER_MODEL = "openai/gpt-4o-mini"
CLASSIFIER_TEMPERATURE = 0.0
CLASSIFIER_MAX_TOKENS = 16
# Tail of the conversation we actually classify — cuts cost and keeps the
# prompt focused on what the guest actually asked about.
MAX_DIALOG_MESSAGES = 20


_SYSTEM_PROMPT = """Ты классифицируешь диалоги клиентов отеля по теме.
Верни РОВНО ОДНО СЛОВО из списка:

- booking — клиент хочет забронировать, спрашивает про даты/цены/доступность
- rooms — вопросы про типы номеров, вместимость, удобства внутри номера
- service — вопросы про услуги отеля: трансфер, ресторан, SPA, экскурсии, парковка
- general — всё остальное: приветствие, адрес, часы, как добраться, общие вопросы

Ответь одним словом, без объяснений."""


def parse_category(raw: Optional[str]) -> Optional[str]:
    """Extract a canonical category token from a free-form LLM reply.

    The model is instructed to return one word, but in practice it sometimes
    wraps the answer ("Категория: booking", "booking."). We scan for the
    first known category token and return it; anything else → None.
    """
    if not raw:
        return None
    text = raw.lower().strip()
    if not text:
        return None
    # Fast path: the whole reply (minus trailing punctuation) is a category.
    stripped = text.rstrip(".!?,:;").strip()
    if stripped in CATEGORIES:
        return stripped
    # Scan tokens left-to-right for the first known category. We break on
    # any non-letter (including "-" and "_") so "general-вопрос" yields the
    # "general" token.
    for token in re.findall(r"[a-zA-Zа-яА-ЯёЁ]+", text):
        if token in CATEGORIES:
            return token
    return None


class _AIServiceLike(Protocol):
    """The subset of AIService we actually call here."""

    async def generate_response(
        self,
        messages: list[dict],
        model: Optional[str] = ...,
        temperature: float = ...,
        max_tokens: int = ...,
    ) -> tuple[str, Optional[dict]]: ...


def _format_dialog(messages: list[dict]) -> str:
    """Turn [{role, content}, ...] into a compact 'Клиент/Ассистент' script."""
    lines: list[str] = []
    for msg in messages[-MAX_DIALOG_MESSAGES:]:
        role = msg.get("role", "").lower()
        content = (msg.get("content") or "").strip()
        if not content:
            continue
        who = "Клиент" if role == "user" else ("Ассистент" if role == "assistant" else role)
        lines.append(f"{who}: {content}")
    return "\n".join(lines)


async def classify_dialog(
    messages: list[dict],
    ai_service: _AIServiceLike,
) -> Optional[str]:
    """Return one of CATEGORIES for the given dialog, or None if unclear.

    `messages` is a list of `{"role": "user"|"assistant", "content": str}`
    (same shape as what `generate_response` consumes). Any AI failure —
    network, garbled reply, or unparsable answer — degrades to None so
    the caller can leave `Conversation.category` NULL and retry later.
    """
    if not messages:
        return None

    dialog_script = _format_dialog(messages)
    if not dialog_script:
        return None

    prompt_messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": f"Диалог:\n{dialog_script}\n\nКатегория:"},
    ]

    try:
        reply, _usage = await ai_service.generate_response(
            messages=prompt_messages,
            model=CLASSIFIER_MODEL,
            temperature=CLASSIFIER_TEMPERATURE,
            max_tokens=CLASSIFIER_MAX_TOKENS,
        )
    except Exception as exc:
        logger.warning("dialog classifier failed: %s", exc)
        return None

    category = parse_category(reply)
    if category is None:
        logger.info("dialog classifier returned unparseable reply: %r", reply)
    return category
