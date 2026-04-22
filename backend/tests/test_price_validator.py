"""Tests for price_validator.validate_prices_in_response.

Scope (per Trello #29 variant C):
- Generic price-cross-validation inside one hotel's rooms.
- No seasonal logic (deferred to #X-SEASONAL).
- No variant-suggestions (deferred to #X-VARIANTS).

Each test builds a minimal hotel stub (SimpleNamespace) with a `rooms` attr
matching the Hotel.rooms JSON format:
    [{"name": str, "price": int, "capacity"?: int, "aliases"?: [str], ...}]
"""
from types import SimpleNamespace

import pytest

from app.services.price_validator import validate_prices_in_response


def _hotel(rooms):
    return SimpleNamespace(rooms=rooms)


# ---------------------------------------------------------------------------
# no-op cases
# ---------------------------------------------------------------------------

def test_empty_text_unchanged():
    hotel = _hotel([{"name": "Twin", "price": 8000}])
    assert validate_prices_in_response("", hotel) == ""


def test_none_hotel_returns_text_unchanged():
    assert validate_prices_in_response("Twin стоит 8 000 сом", None) == "Twin стоит 8 000 сом"


def test_hotel_without_rooms_returns_text_unchanged():
    hotel = SimpleNamespace(rooms=None)
    text = "Twin стоит 8 000 сом"
    assert validate_prices_in_response(text, hotel) == text


def test_empty_rooms_list_returns_text_unchanged():
    hotel = _hotel([])
    text = "Twin стоит 8 000 сом"
    assert validate_prices_in_response(text, hotel) == text


def test_rooms_without_prices_returns_text_unchanged():
    hotel = _hotel([{"name": "Twin"}, {"name": "Family", "price": None}])
    text = "Twin стоит 8 000 сом"
    assert validate_prices_in_response(text, hotel) == text


def test_correct_price_unchanged():
    hotel = _hotel([
        {"name": "Twin", "price": 8000},
        {"name": "Семейный", "price": 14000},
    ])
    text = "Twin — 8 000 сом за ночь"
    assert validate_prices_in_response(text, hotel) == text


def test_price_not_matching_any_room_unchanged():
    # e.g. «итого за 3 ночи 24 000 сом» — 24 000 нет в таблице
    hotel = _hotel([
        {"name": "Twin", "price": 8000},
        {"name": "Family", "price": 14000},
    ])
    text = "Twin — за 3 ночи выходит 24 000 сом"
    # 24 000 не совпадает ни с одной ценой номера — не трогаем
    assert validate_prices_in_response(text, hotel) == text


# ---------------------------------------------------------------------------
# correction cases
# ---------------------------------------------------------------------------

def test_wrong_price_swapped_with_other_room_type_is_fixed():
    """AI написал для Twin цену Семейного — должно исправиться."""
    hotel = _hotel([
        {"name": "Twin", "price": 8000},
        {"name": "Семейный", "price": 14000},
    ])
    text = "Twin стоит 14 000 сом за ночь"
    out = validate_prices_in_response(text, hotel)
    assert "8 000" in out
    assert "14 000" not in out


def test_case_insensitive_room_name():
    hotel = _hotel([
        {"name": "Twin", "price": 8000},
        {"name": "Семейный", "price": 14000},
    ])
    text = "TWIN стоит 14 000 сом"
    out = validate_prices_in_response(text, hotel)
    assert "8 000" in out


def test_two_rooms_each_wrong_both_fixed():
    hotel = _hotel([
        {"name": "Twin", "price": 8000},
        {"name": "Семейный", "price": 14000},
    ])
    # Twin с ценой Family, Family с ценой Twin
    text = "Twin — 14 000 сом. Семейный — 8 000 сом."
    out = validate_prices_in_response(text, hotel)
    assert "Twin — 8 000 сом" in out
    assert "Семейный — 14 000 сом" in out


def test_aliases_are_matched():
    """Alias в поле aliases должен работать как имя номера."""
    hotel = _hotel([
        {"name": "Twin", "price": 8000, "aliases": ["твин", "2-местный"]},
        {"name": "Семейный", "price": 14000, "aliases": ["4-местный"]},
    ])
    text = "2-местный — 14 000 сом"
    out = validate_prices_in_response(text, hotel)
    assert "8 000" in out


def test_price_with_spaces_and_commas_parsed():
    """Разные форматы: "8 000", "8000", "8,000" — все должны распознаваться и исправляться."""
    hotel = _hotel([
        {"name": "Twin", "price": 8000},
        {"name": "Семейный", "price": 14000},
    ])
    # цена без пробелов
    text = "Twin — 14000 сом"
    out = validate_prices_in_response(text, hotel)
    assert "14000" not in out or "8 000" in out  # формат нормализован


def test_unrelated_numbers_not_touched():
    """Числа которые не похожи на цены (без валюты) — не трогаем."""
    hotel = _hotel([
        {"name": "Twin", "price": 8000},
        {"name": "Семейный", "price": 14000},
    ])
    text = "В нашем отеле 14 номеров. Twin — 8 000 сом."
    out = validate_prices_in_response(text, hotel)
    # "14 номеров" — не цена, не трогаем; правильная цена Twin — тоже не трогаем
    assert "14 номеров" in out
    assert "8 000 сом" in out


def test_price_outside_alias_window_not_corrected():
    """Если цена находится далеко от имени номера — мы её не трогаем.

    Без близкого контекста мы не можем утверждать что это именно цена ЭТОГО типа.
    """
    hotel = _hotel([
        {"name": "Twin", "price": 8000},
        {"name": "Семейный", "price": 14000},
    ])
    # Между "Twin" и "14 000" ~200 символов текста — вне окна валидации
    filler = " ".join(["бла"] * 60)  # ~240 символов
    text = f"Twin — хороший номер. {filler} И где-то было 14 000 сом"
    out = validate_prices_in_response(text, hotel)
    # вне окна — не трогаем
    assert out == text


def test_zero_price_room_skipped():
    """Если у номера price = 0 — пропускаем, не ставим 0 сом в ответ."""
    hotel = _hotel([
        {"name": "Twin", "price": 0},
        {"name": "Семейный", "price": 14000},
    ])
    text = "Twin стоит 14 000 сом"  # формально неправильно (Twin.price=0) но мы не знаем правильной цены
    out = validate_prices_in_response(text, hotel)
    # Twin с ценой 0 — данные не заполнены, не трогаем
    assert out == text
