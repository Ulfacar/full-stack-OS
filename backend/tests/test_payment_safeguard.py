"""Tests for response_processor.check_payment_placeholder.

The safeguard runs after process_response. It returns a non-None string
iff the bot tried to quote a [РЕКВИЗИТЫ]-shaped placeholder and the
hotel has no payment_details filled — callers must then notify the owner
and skip sending to the client.
"""
from types import SimpleNamespace

import pytest

from app.services.response_processor import check_payment_placeholder


def _hotel(payment_details=None):
    return SimpleNamespace(payment_details=payment_details)


# ---------------------------------------------------------------------------
# happy-path: nothing to block
# ---------------------------------------------------------------------------

def test_empty_text_returns_none():
    assert check_payment_placeholder("", _hotel()) is None


def test_none_hotel_returns_none():
    assert check_payment_placeholder("Карта: [РЕКВИЗИТЫ]", None) is None


def test_regular_reply_without_placeholder_returns_none():
    text = "Номер Twin стоит 8 000 сом за ночь. Предоплата 30%."
    assert check_payment_placeholder(text, _hotel()) is None


def test_filled_payment_details_lets_placeholder_through():
    """If the hotel has filled details we trust the prompt to have inlined them.

    Any leftover placeholder at this point is odd but not a safety issue —
    we only block when details are missing.
    """
    hotel = _hotel({"bank_details": "Mbank 1234 5678 9012 3456"})
    # Bot wrote out the filled details + (weirdly) still a placeholder.
    text = "Реквизиты: Mbank 1234 5678 9012 3456. Ещё есть [РЕКВИЗИТЫ]."
    assert check_payment_placeholder(text, hotel) is None


def test_empty_dict_payment_details_treated_as_missing():
    hotel = _hotel({})
    text = "Оплата: [РЕКВИЗИТЫ]"
    assert check_payment_placeholder(text, hotel) == "payment_details_empty"


def test_payment_details_with_all_blank_fields_treated_as_missing():
    hotel = _hotel({"bank_details": "", "phone_for_payment": "", "iban": None})
    text = "Карта: [РЕКВИЗИТЫ]"
    assert check_payment_placeholder(text, hotel) == "payment_details_empty"


# ---------------------------------------------------------------------------
# block conditions: placeholder present AND details missing
# ---------------------------------------------------------------------------

def test_blocks_on_uppercase_placeholder():
    hotel = _hotel(None)
    text = "Сумма 6 000 сом. Оплата: [РЕКВИЗИТЫ]"
    assert check_payment_placeholder(text, hotel) == "payment_details_empty"


def test_blocks_on_lowercase_placeholder():
    hotel = _hotel(None)
    text = "Оплата: [реквизиты]"
    assert check_payment_placeholder(text, hotel) == "payment_details_empty"


def test_blocks_on_mixed_case_placeholder():
    hotel = _hotel(None)
    text = "Оплата: [Реквизиты]"
    assert check_payment_placeholder(text, hotel) == "payment_details_empty"


def test_blocks_on_english_placeholder_variant():
    """Defensive — some prompt versions might use English names."""
    hotel = _hotel(None)
    text = "Payment: [payment_details]"
    assert check_payment_placeholder(text, hotel) == "payment_details_empty"


def test_does_not_false_positive_on_word_without_brackets():
    """'Реквизиты' as a regular word in prose must NOT trigger the block."""
    hotel = _hotel(None)
    text = "Наши реквизиты можно уточнить у менеджера."
    assert check_payment_placeholder(text, hotel) is None
