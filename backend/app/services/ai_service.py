"""
AI Service for OpenRouter integration
Handles communication with AI models (Haiku, GPT-4, Claude, etc.)
"""
from openai import AsyncOpenAI
from typing import List, Dict, Tuple, Optional
from ..core.config import settings
from .response_processor import is_garbled, process_response


# Pricing per 1M tokens (input, output) in USD
MODEL_PRICING = {
    "anthropic/claude-3.5-haiku": (1.0, 5.0),
    "anthropic/claude-3-haiku": (0.25, 1.25),
    "deepseek/deepseek-chat": (0.14, 0.28),
    "openai/gpt-4o": (2.5, 10.0),
    "openai/gpt-4o-mini": (0.15, 0.6),
}


class AIService:
    """Service for AI model interactions via OpenRouter"""

    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL
        )

    @staticmethod
    def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
        """Calculate cost in USD for given token counts."""
        input_price, output_price = MODEL_PRICING.get(model, (1.0, 5.0))
        cost = (prompt_tokens * input_price + completion_tokens * output_price) / 1_000_000
        return round(cost, 6)

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        model: str = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Tuple[str, Optional[Dict]]:
        """
        Generate AI response using OpenRouter.

        Returns:
            Tuple of (response_text, usage_dict) where usage_dict contains
            prompt_tokens, completion_tokens, model, cost_usd.
            Returns (error_text, None) on failure.
        """
        if model is None:
            model = settings.DEFAULT_AI_MODEL

        max_retries = 3
        total_usage = None

        for attempt in range(max_retries):
            try:
                response = await self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )

                text = response.choices[0].message.content
                usage = None

                if response.usage:
                    prompt_tokens = response.usage.prompt_tokens or 0
                    completion_tokens = response.usage.completion_tokens or 0
                    cost = self.calculate_cost(model, prompt_tokens, completion_tokens)
                    usage = {
                        "prompt_tokens": prompt_tokens,
                        "completion_tokens": completion_tokens,
                        "model": model,
                        "cost_usd": cost,
                    }
                    # Accumulate usage across retries
                    if total_usage:
                        total_usage["prompt_tokens"] += usage["prompt_tokens"]
                        total_usage["completion_tokens"] += usage["completion_tokens"]
                        total_usage["cost_usd"] += usage["cost_usd"]
                    else:
                        total_usage = usage.copy()

                # Check for garbled output — retry if corrupted
                if is_garbled(text):
                    print(f"Garbled response (attempt {attempt + 1}), retrying...")
                    continue

                return text, total_usage

            except Exception as e:
                print(f"AI Service Error (attempt {attempt + 1}): {e}")
                if attempt == max_retries - 1:
                    return "Извините, произошла ошибка. Попробуйте позже или свяжитесь с администрацией отеля.", total_usage

        return "Извините, произошла ошибка. Попробуйте позже или свяжитесь с администрацией отеля.", total_usage

    async def generate_system_prompt(self, hotel_data: dict) -> str:
        """Generate system prompt based on hotel data."""
        prompt_parts = []

        prompt_parts.append(
            f"Вы - AI-ассистент отеля '{hotel_data.get('name', 'наш отель')}'. "
            f"Ваша задача - помогать гостям с информацией об отеле, бронированием и любыми вопросами."
        )

        if hotel_data.get('description'):
            prompt_parts.append(f"\n\nОписание отеля:\n{hotel_data['description']}")

        if hotel_data.get('address'):
            prompt_parts.append(f"\n\nАдрес: {hotel_data['address']}")

        contacts = []
        if hotel_data.get('phone'):
            contacts.append(f"телефон {hotel_data['phone']}")
        if hotel_data.get('email'):
            contacts.append(f"email {hotel_data['email']}")
        if hotel_data.get('website'):
            contacts.append(f"сайт {hotel_data['website']}")
        if contacts:
            prompt_parts.append(f"\n\nКонтакты: {', '.join(contacts)}")

        if hotel_data.get('rooms'):
            rooms_info = "\n\nДоступные номера:"
            for room in hotel_data['rooms']:
                rooms_info += f"\n- {room.get('name')}: вместимость {room.get('capacity')} чел., "
                rooms_info += f"цена {room.get('price')} руб/ночь. {room.get('description', '')}"
            prompt_parts.append(rooms_info)

        if hotel_data.get('rules'):
            rules = hotel_data['rules']
            rules_info = "\n\nПравила отеля:"
            if rules.get('checkin'):
                rules_info += f"\n- Заезд: {rules['checkin']}"
            if rules.get('checkout'):
                rules_info += f"\n- Выезд: {rules['checkout']}"
            if rules.get('cancellation'):
                rules_info += f"\n- Отмена бронирования: {rules['cancellation']}"
            if rules.get('pets'):
                rules_info += f"\n- Размещение с животными: {rules['pets']}"
            if rules.get('smoking'):
                rules_info += f"\n- Курение: {rules['smoking']}"
            prompt_parts.append(rules_info)

        if hotel_data.get('amenities'):
            amenities = hotel_data['amenities']
            amenities_list = []
            if amenities.get('wifi'):
                amenities_list.append("Wi-Fi")
            if amenities.get('parking'):
                amenities_list.append("парковка")
            if amenities.get('breakfast'):
                amenities_list.append("завтрак")
            if amenities.get('restaurant'):
                amenities_list.append("ресторан")
            if amenities.get('gym'):
                amenities_list.append("спортзал")
            if amenities.get('pool'):
                amenities_list.append("бассейн")
            if amenities.get('spa'):
                amenities_list.append("спа")
            if amenities_list:
                prompt_parts.append(f"\n\nУдобства: {', '.join(amenities_list)}")

        style = hotel_data.get('communication_style', 'friendly')
        style_instructions = {
            'friendly': '\n\nОбщайтесь дружелюбно и неформально, как с хорошими знакомыми.',
            'formal': '\n\nОбщайтесь формально и профессионально, соблюдая деловой этикет.',
            'casual': '\n\nОбщайтесь просто и непринужденно, без лишних формальностей.'
        }
        prompt_parts.append(style_instructions.get(style, style_instructions['friendly']))

        prompt_parts.append(
            "\n\nВажно:\n"
            "- Отвечайте кратко и по делу\n"
            "- Если не знаете точного ответа - так и скажите\n"
            "- Для бронирования попросите контактные данные (имя, телефон) и даты заезда/выезда\n"
            "- При сложных вопросах предложите связаться с администрацией напрямую"
        )

        return "".join(prompt_parts)


# Global instance
ai_service = AIService()
