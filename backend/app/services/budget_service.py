"""
Budget Service — per-hotel monthly token budget enforcement.
"""
from datetime import datetime
from typing import Tuple

from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.models import AIUsage, Hotel
from .ai_service import AIService


class BudgetService:
    """Manages monthly AI budget per hotel."""

    async def get_monthly_spend(self, hotel_id: int, db: AsyncSession) -> float:
        """Get total AI spend for current month in USD."""
        now = datetime.utcnow()
        result = await db.execute(
            select(func.coalesce(func.sum(AIUsage.cost_usd), 0.0))
            .where(AIUsage.hotel_id == hotel_id)
            .where(extract("year", AIUsage.created_at) == now.year)
            .where(extract("month", AIUsage.created_at) == now.month)
        )
        return float(result.scalar())

    async def check_budget(self, hotel_id: int, db: AsyncSession) -> Tuple[bool, float]:
        """
        Check if hotel has remaining AI budget.

        Returns:
            (has_budget, remaining_usd)
        """
        hotel = await db.get(Hotel, hotel_id)
        if not hotel:
            return False, 0.0

        spent = await self.get_monthly_spend(hotel_id, db)
        remaining = hotel.monthly_budget - spent
        return remaining > 0, round(remaining, 4)

    async def record_usage(
        self,
        hotel_id: int,
        prompt_tokens: int,
        completion_tokens: int,
        model: str,
        db: AsyncSession,
        conversation_id: int = None,
    ) -> AIUsage:
        """Record AI usage with pre-calculated cost."""
        cost = AIService.calculate_cost(model, prompt_tokens, completion_tokens)

        usage = AIUsage(
            hotel_id=hotel_id,
            conversation_id=conversation_id,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            model=model,
            cost_usd=cost,
        )
        db.add(usage)
        await db.commit()
        return usage


# Global instance
budget_service = BudgetService()
