"""Tests for dialog_classifier.classify_dialog.

Classifier takes a conversation history and returns one of four categories
(booking, general, rooms, service) using a cheap LLM. We inject a fake
AI-call coroutine so the tests don't touch the network.
"""
import pytest

from app.services.dialog_classifier import (
    CATEGORIES,
    classify_dialog,
    parse_category,
)


# ---------------------------------------------------------------------------
# parse_category — pure string parsing, no AI involved
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("raw,expected", [
    ("booking", "booking"),
    ("BOOKING", "booking"),
    ("  booking  ", "booking"),
    ("general", "general"),
    ("rooms", "rooms"),
    ("service", "service"),
])
def test_parse_category_canonical(raw, expected):
    assert parse_category(raw) == expected


def test_parse_category_with_label_prefix():
    # LLM may prepend "Категория: "
    assert parse_category("Категория: booking") == "booking"
    assert parse_category("Category: service") == "service"


def test_parse_category_with_trailing_punct():
    assert parse_category("booking.") == "booking"
    assert parse_category("rooms!") == "rooms"


def test_parse_category_unknown_returns_none():
    assert parse_category("не знаю") is None
    assert parse_category("") is None
    assert parse_category("something_else") is None
    assert parse_category(None) is None


def test_parse_category_multiword_picks_first_known():
    # When LLM returns free-form "I think it's booking because..."
    assert parse_category("I think it's booking because of dates") == "booking"
    assert parse_category("Это general-вопрос") == "general"


# ---------------------------------------------------------------------------
# classify_dialog — integration of AI call + parsing
# ---------------------------------------------------------------------------

def _messages(pairs):
    """Helper: [("user", "привет"), ("assistant", "здравствуйте")] -> dicts."""
    return [{"role": r, "content": c} for r, c in pairs]


class _FakeAI:
    """Replaces AIService.generate_response for tests."""

    def __init__(self, reply):
        self.reply = reply
        self.calls = []

    async def generate_response(self, messages, model=None, temperature=0.7, max_tokens=1000):
        self.calls.append({"messages": messages, "model": model, "temperature": temperature})
        return self.reply, {"prompt_tokens": 10, "completion_tokens": 2, "model": model or "", "cost_usd": 0.0}


@pytest.mark.asyncio
async def test_classify_empty_messages_returns_none():
    ai = _FakeAI("booking")
    out = await classify_dialog([], ai_service=ai)
    assert out is None
    assert ai.calls == []  # don't burn tokens on empty input


@pytest.mark.asyncio
async def test_classify_returns_parsed_category():
    ai = _FakeAI("booking")
    out = await classify_dialog(_messages([
        ("user", "Хочу забронировать номер на 15 августа"),
        ("assistant", "Конечно, сколько гостей?"),
    ]), ai_service=ai)
    assert out == "booking"


@pytest.mark.asyncio
async def test_classify_handles_labelled_llm_reply():
    ai = _FakeAI("Категория: service")
    out = await classify_dialog(_messages([
        ("user", "Есть ли у вас трансфер с аэропорта?"),
    ]), ai_service=ai)
    assert out == "service"


@pytest.mark.asyncio
async def test_classify_unknown_reply_returns_none():
    ai = _FakeAI("Не могу определить, слишком мало сообщений")
    out = await classify_dialog(_messages([
        ("user", "Привет"),
    ]), ai_service=ai)
    assert out is None


@pytest.mark.asyncio
async def test_classify_ai_exception_returns_none():
    class Boom:
        async def generate_response(self, **kw):
            raise RuntimeError("API down")
    out = await classify_dialog(_messages([("user", "Забронировать 2 номера")]), ai_service=Boom())
    assert out is None


@pytest.mark.asyncio
async def test_classify_uses_cheap_model_and_low_temperature():
    ai = _FakeAI("general")
    await classify_dialog(_messages([("user", "Какой адрес?")]), ai_service=ai)
    assert len(ai.calls) == 1
    call = ai.calls[0]
    # Must pin a cheap model and near-zero temperature for determinism
    assert call["model"] == "openai/gpt-4o-mini"
    assert call["temperature"] <= 0.1


@pytest.mark.asyncio
async def test_classify_sends_hotel_dialog_to_llm():
    ai = _FakeAI("rooms")
    await classify_dialog(_messages([
        ("user", "Какие номера есть?"),
        ("assistant", "Twin, Семейный, Люкс"),
    ]), ai_service=ai)
    # Check that at least one of our messages is present in the prompt
    sent = ai.calls[0]["messages"]
    full = " ".join(m["content"] for m in sent)
    assert "Какие номера есть" in full
    assert "Twin, Семейный, Люкс" in full


# ---------------------------------------------------------------------------
# sanity: CATEGORIES constant is the source of truth
# ---------------------------------------------------------------------------

def test_categories_constant_matches_parser():
    for cat in CATEGORIES:
        assert parse_category(cat) == cat
