"""
AI Service for OpenRouter integration
Handles communication with AI models (DeepSeek, GPT-4, Claude, etc.)
"""
from openai import AsyncOpenAI
from typing import List, Dict
from ..core.config import settings


class AIService:
    """Service for AI model interactions via OpenRouter"""

    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL
        )

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        model: str = "deepseek/deepseek-chat",
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> str:
        """
        Generate AI response using OpenRouter

        Args:
            messages: List of message dicts [{"role": "user/assistant/system", "content": "..."}]
            model: Model identifier (e.g., "deepseek/deepseek-chat", "openai/gpt-4o")
            temperature: Response creativity (0.0-1.0)
            max_tokens: Maximum response length

        Returns:
            AI-generated response text
        """
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )

            return response.choices[0].message.content

        except Exception as e:
            print(f"AI Service Error: {e}")
            return "Извините, произошла ошибка. Попробуйте позже или свяжитесь с администрацией отеля."

    async def generate_system_prompt(self, hotel_data: dict) -> str:
        """
        Generate system prompt based on hotel data

        Args:
            hotel_data: Dict with hotel info (name, description, rooms, rules, amenities, etc.)

        Returns:
            System prompt text
        """
        prompt_parts = []

        # Base instruction
        prompt_parts.append(
            f"Вы - AI-ассистент отеля '{hotel_data.get('name', 'наш отель')}'. "
            f"Ваша задача - помогать гостям с информацией об отеле, бронированием и любыми вопросами."
        )

        # Description
        if hotel_data.get('description'):
            prompt_parts.append(f"\n\nОписание отеля:\n{hotel_data['description']}")

        # Location
        if hotel_data.get('address'):
            prompt_parts.append(f"\n\nАдрес: {hotel_data['address']}")

        # Contact info
        contacts = []
        if hotel_data.get('phone'):
            contacts.append(f"телефон {hotel_data['phone']}")
        if hotel_data.get('email'):
            contacts.append(f"email {hotel_data['email']}")
        if hotel_data.get('website'):
            contacts.append(f"сайт {hotel_data['website']}")

        if contacts:
            prompt_parts.append(f"\n\nКонтакты: {', '.join(contacts)}")

        # Rooms
        if hotel_data.get('rooms'):
            rooms_info = "\n\nДоступные номера:"
            for room in hotel_data['rooms']:
                rooms_info += f"\n- {room.get('name')}: вместимость {room.get('capacity')} чел., "
                rooms_info += f"цена {room.get('price')} руб/ночь. {room.get('description', '')}"
            prompt_parts.append(rooms_info)

        # Rules
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

        # Amenities
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

        # Communication style
        style = hotel_data.get('communication_style', 'friendly')
        style_instructions = {
            'friendly': '\n\nОбщайтесь дружелюбно и неформально, как с хорошими знакомыми.',
            'formal': '\n\nОбщайтесь формально и профессионально, соблюдая деловой этикет.',
            'casual': '\n\nОбщайтесь просто и непринужденно, без лишних формальностей.'
        }
        prompt_parts.append(style_instructions.get(style, style_instructions['friendly']))

        # Final instructions
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
