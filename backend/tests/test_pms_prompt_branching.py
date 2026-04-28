"""Tests for ai_service.generate_system_prompt branching by pms_kind (#21)."""
from __future__ import annotations

import pytest

from app.services.ai_service import AIService


@pytest.fixture
def ai():
    return AIService()


@pytest.fixture
def base_data():
    """Minimal valid hotel data — only fields required for prompt rendering."""
    return {
        "name": "Test Hotel",
        "description": "Boutique hotel.",
        "address": "Bishkek",
        "rooms": [{"name": "Standard", "capacity": 2, "price": 4500}],
        "rules": {"checkin": "14:00", "checkout": "12:00"},
        "amenities": {"wifi": True, "breakfast": True},
        "communication_style": "friendly",
        "proactiveness": "balanced",
    }


@pytest.mark.asyncio
async def test_pms_none_default_when_unset(ai, base_data):
    prompt = await ai.generate_system_prompt(base_data)
    assert "## PMS" in prompt
    assert "вручную" in prompt.lower() or "google sheets" in prompt.lower()
    # Critical: must NOT promise the guest the booking lands in any system
    assert "exely" not in prompt.lower()
    assert "altegio" not in prompt.lower()


@pytest.mark.asyncio
async def test_pms_exely_branch(ai, base_data):
    base_data["pms_kind"] = "exely"
    prompt = await ai.generate_system_prompt(base_data)
    assert "Exely" in prompt
    assert "автоматически появится" in prompt or "автоматически" in prompt
    # No-PMS warning should not leak
    assert "вручную" not in prompt.split("## PMS")[1].split("##")[0].lower()


@pytest.mark.asyncio
async def test_pms_altegio_branch(ai, base_data):
    base_data["pms_kind"] = "altegio"
    prompt = await ai.generate_system_prompt(base_data)
    assert "Altegio" in prompt


@pytest.mark.asyncio
async def test_pms_shelter_branch(ai, base_data):
    base_data["pms_kind"] = "shelter"
    prompt = await ai.generate_system_prompt(base_data)
    assert "Shelter" in prompt


@pytest.mark.asyncio
async def test_pms_custom_branch(ai, base_data):
    base_data["pms_kind"] = "custom"
    prompt = await ai.generate_system_prompt(base_data)
    assert "собственную систему" in prompt or "внутренней CRM" in prompt


@pytest.mark.asyncio
async def test_pms_unknown_value_falls_back_to_none(ai, base_data):
    """Defensive: if a typo'd value reaches the generator, behave like 'none'."""
    base_data["pms_kind"] = "definitely-not-a-real-pms"
    prompt = await ai.generate_system_prompt(base_data)
    assert "## PMS" in prompt
    # Should be the no-PMS branch
    assert "вручную" in prompt.lower() or "google sheets" in prompt.lower()


@pytest.mark.asyncio
async def test_pms_section_is_after_booking_section(ai, base_data):
    """PMS rules elaborate on the booking flow — must come after it so the
    LLM reads booking steps first, then the post-confirmation note."""
    base_data["pms_kind"] = "exely"
    prompt = await ai.generate_system_prompt(base_data)
    assert prompt.index("## БРОНИРОВАНИЕ") < prompt.index("## PMS")
