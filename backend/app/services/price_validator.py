"""Price validator — defensive post-processing for AI responses.

Ported/generalized from Bot-Azure `fix_prices_in_response` (assistant.py:900).
Key differences from the Ton-Azure original:
  * No hardcoded `_CORRECT_PRICES` table — reads per-hotel `rooms` JSON.
  * No seasonal awareness — deferred to a separate Backlog card.
  * No variant suggestions (`ensure_room_variants`) — deferred separately.

The validator catches the common AI mistake where cheaper/pricier room types
get their numbers swapped (e.g. AI says "Twin — 14 000 сом" when Twin is 8000
and Family is 14000). We only correct prices that are explicit room-type
prices from this hotel's own `rooms` list — arithmetic totals like "24 000 за
3 ночи" are left alone.
"""
from __future__ import annotations

import re
from typing import Any, Iterable


# Matches a price number followed by a KGS unit. We deliberately require
# trailing "00" to filter out arbitrary integers like room counts.
_PRICE_RE = re.compile(r"(\d[\d\s.,]*\d00)\s*(?:сом|сум|KGS|kgs)", re.IGNORECASE)

# How far from a room-name mention we trust a price is "about this room".
_CONTEXT_WINDOW = 100


def _norm(s: str) -> str:
    return s.lower().replace("ё", "е")


def _parse_price(raw: str) -> int | None:
    clean = raw.replace(" ", "").replace(" ", "").replace(",", "").replace(".", "")
    try:
        return int(clean)
    except ValueError:
        return None


def _format_price(value: int) -> str:
    # "8000" -> "8 000"
    return f"{value:,}".replace(",", " ")


def _room_aliases(room: dict) -> list[str]:
    names: list[str] = []
    name = room.get("name")
    if name:
        names.append(name)
    aliases = room.get("aliases") or []
    if isinstance(aliases, Iterable):
        names.extend(a for a in aliases if a)
    return [_norm(n) for n in names if n]


def validate_prices_in_response(response_text: str, hotel: Any) -> str:
    """Correct obvious price swaps between room types of the same hotel.

    Args:
        response_text: AI response aimed at the client.
        hotel: ORM row (or any object) exposing `rooms` — the JSON list
            `[{"name": str, "price": int, "aliases"?: list[str], ...}]`.

    Returns:
        response_text with swapped prices replaced by the right ones.
        Unchanged when we lack enough info to correct safely.
    """
    if not response_text or hotel is None:
        return response_text

    rooms = getattr(hotel, "rooms", None)
    if not rooms:
        return response_text

    # Build the set of "known prices" across all rooms of this hotel.
    # Only rooms with a positive numeric price participate in validation —
    # we can't correct anything if the right price is missing or zero.
    priced_rooms: list[dict] = []
    valid_prices: set[int] = set()
    for room in rooms:
        if not isinstance(room, dict):
            continue
        price = room.get("price")
        if not isinstance(price, (int, float)) or price <= 0:
            continue
        priced_rooms.append(room)
        valid_prices.add(int(price))

    if len(priced_rooms) < 2:
        # Need at least two rooms with prices to detect a swap.
        return response_text

    text = response_text
    text_lower = _norm(text)

    for room in priced_rooms:
        right_price = int(room["price"])
        aliases = _room_aliases(room)
        if not aliases:
            continue

        for alias in aliases:
            if alias not in text_lower:
                continue

            for alias_match in re.finditer(re.escape(alias), text_lower):
                window_start = alias_match.start()
                window_end = alias_match.end() + _CONTEXT_WINDOW
                window_text = text[window_start:window_end]

                price_match = _PRICE_RE.search(window_text)
                if not price_match:
                    continue

                found = _parse_price(price_match.group(1))
                if found is None:
                    continue
                if found == right_price:
                    continue  # correct price, nothing to do
                if found not in valid_prices:
                    continue  # unrelated number (e.g. nightly total)

                # Compute absolute positions in the *current* text.
                abs_match_start = window_start + price_match.start()
                abs_number_start = window_start + price_match.start(1)
                abs_number_end = window_start + price_match.end(1)

                # Replace just the numeric chunk, preserving the unit.
                new_number = _format_price(right_price)
                text = text[:abs_number_start] + new_number + text[abs_number_end:]
                text_lower = _norm(text)
                # Move on to the next alias mention; the positions shifted.
                break

    return text
