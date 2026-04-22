"""
Response Processor — post-processing pipeline for AI responses.
Based on lessons from Ton Azure: AI violates prompt rules 10-20% of the time.
"""
import re
from typing import Any, Optional, Tuple

from .price_validator import validate_prices_in_response


# Навязчивые вопросы которые бот добавляет без просьбы
_PUSHY_PATTERNS = [
    r"хотите забронировать\??",
    r"могу оформить\!?",
    r"устраивает\??",
    r"желаете забронировать\??",
    r"оформим бронь\??",
    r"готовы забронировать\??",
    r"вам подходит\??",
    r"нужен трансфер\??",
    r"нужна помощь с бронированием\??",
    r"хотите узнать подробнее\??",
    r"интересует бронирование\??",
    r"помочь с бронированием\??",
    r"хотите, чтобы я забронировал[аи]?\??",
    r"давайте оформим\??",
    r"если хотите.*свяжитесь",
    r"могу помочь с чем-то ещ[её]\??",
    r"есть ещ[её] вопросы\??",
    r"что-нибудь ещ[её]\??",
    r"чем ещ[её] могу помочь\??",
    r"нужна ли.*дополнительная информация\??",
]

# Фразы которые бот не должен говорить клиенту (внутренние)
_INTERNAL_PHRASES = [
    r"прошу оформить",
    r"прошу связаться с гостем",
    r"передаю заявку",
    r"оформляю бронь",
    r"связаться с клиентом",
]

# Теги которые нужно убрать из ответа клиенту
_TAG_PATTERNS = [
    r"\[НУЖЕН_МЕНЕДЖЕР\]",
    r"\[ЗАВЕРШЕНО\]",
    r"\[КАТЕГОРИЯ:[^\]]*\]",
]


def is_garbled(text: str) -> bool:
    """Detect garbled/corrupted AI output."""
    if not text or len(text) < 5:
        return True

    # Too many colons (corrupted output)
    if text.count(":") > 15:
        return True

    # Too many repeated words
    words = text.split()
    if len(words) > 5:
        repeats = sum(1 for i in range(1, len(words)) if words[i] == words[i - 1])
        if repeats > 3:
            return True

    return False


def extract_manager_tag(text: str) -> Tuple[str, bool]:
    """
    Check if response contains [НУЖЕН_МЕНЕДЖЕР] tag.
    Returns (cleaned_text, needs_manager).
    Must be called BEFORE clean_response.
    """
    needs_manager = bool(re.search(r"\[НУЖЕН_МЕНЕДЖЕР\]", text))
    return text, needs_manager


def clean_response(text: str) -> str:
    """
    Clean AI response for client consumption.
    Removes tags, internal phrases, pushy questions.
    """
    if not text:
        return text

    # 1. Remove tags
    for pattern in _TAG_PATTERNS:
        text = re.sub(pattern, "", text)

    # 2. Remove internal phrases
    for pattern in _INTERNAL_PHRASES:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)

    # 3. Strip trailing pushy questions
    text = _strip_trailing_questions(text)

    # 4. Clean up whitespace
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"  +", " ", text)
    text = re.sub(r"\.\.", ".", text)
    text = text.strip()

    return text


def _strip_trailing_questions(text: str) -> str:
    """Remove pushy questions from the end of the response."""
    lines = text.strip().split("\n")

    # Check last 2 lines
    for _ in range(2):
        if not lines:
            break
        last_line = lines[-1].strip()
        if not last_line:
            lines.pop()
            continue
        for pattern in _PUSHY_PATTERNS:
            if re.search(pattern, last_line, re.IGNORECASE):
                lines.pop()
                break
        else:
            break  # Last line is not pushy, stop

    return "\n".join(lines)


def process_response(text: str, hotel: Optional[Any] = None) -> Tuple[str, bool]:
    """
    Full post-processing pipeline.
    Returns (processed_text, needs_manager).

    Pipeline:
    1. is_garbled check (caller should retry if True)
    2. extract_manager_tag (before cleaning)
    3. clean_response (tags, internal phrases, pushy questions)
    4. validate_prices_in_response (when hotel is provided) — catches cross-type
       price swaps using the hotel's own rooms list.
    """
    if is_garbled(text):
        return text, False  # Caller should retry

    # Extract manager tag before cleaning
    text, needs_manager = extract_manager_tag(text)

    # Clean response
    text = clean_response(text)

    # Validate prices against hotel's rooms (no-op if hotel is None or lacks rooms)
    if hotel is not None:
        text = validate_prices_in_response(text, hotel)

    return text, needs_manager
