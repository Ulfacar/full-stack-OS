"""Demo data seeder for investor pitch (Sprint 2 Stretch Day, prepares Sat 02.05).

Idempotent — running twice clears + re-seeds the same demo set so the
investor always sees consistent numbers. Targets ConfirmedBooking + diverse
Conversation fixtures so the /reports page shows impressive April 2026 KPIs.

Run: ``python scripts/seed_demo_for_pitch.py``

What it produces (April 2026):
- 1 hotel "Demo Hotel — Issyk-Kul" (slug demo-hotel) owned by demo@asystem.com
- 1 Telegram client + 14 conversations spread across the month, mixed
  categories (booking / hotel / service / general)
- 12 confirmed bookings totalling $4,680 → ROI 117× vs $40/mo subscription
- activated_at backdated to 2026-04-03 so the "Активирован" badge looks right

Targets: hotel_id=2, conversation_id=2..15, ConfirmedBooking ids 2..13.
"""
import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)
if BACKEND not in sys.path:
    sys.path.insert(0, BACKEND)

from sqlalchemy import delete, select  # noqa: E402

from app.db.database import AsyncSessionLocal  # noqa: E402
from app.db.models import (  # noqa: E402
    Client, ConfirmedBooking, Conversation, Hotel, Message, User,
)


HOTEL_SLUG = "demo-hotel"
HOTEL_NAME = "Demo Hotel — Issyk-Kul"
CLIENT_TG_ID = "987654321"


# (day, category, status, unread, list[(sender, content)])
# sender ∈ {"client", "bot", "operator"}. role is derived in seeder
# (client/operator → "user", bot → "assistant").
CONVERSATION_FIXTURES = [
    (3, "booking", "completed", 0, [
        ("client", "Здравствуйте, есть номера на 5-7 апреля?"),
        ("bot", "Здравствуйте! На 5-7 апреля свободны:\n• Стандарт — 4 500 ₽/ночь (двусп.)\n• Полулюкс — 7 200 ₽/ночь (с балконом)\n\nНа сколько гостей оформляем?"),
        ("client", "Двое, нужен Стандарт"),
        ("bot", "Отлично! На 5-7 апреля Стандарт двусп. — 9 000 ₽ за 2 ночи. На кого оформить бронь?"),
        ("client", "Иван Петров, +996 700 11 22 33"),
        ("bot", "Записал. Передаю менеджеру для подтверждения!"),
        ("operator", "Подтверждаю бронь, Иван! Жду вас 5 апреля с 14:00."),
    ]),
    (5, "booking", "completed", 0, [
        ("client", "Полулюкс на 8-10, мы трое — есть?"),
        ("bot", "На 8-10 апреля Полулюкс свободен. 7 200 ₽/ночь (3 гостя проходят). Имя и телефон для брони?"),
        ("client", "Айгуль, +996 555 88 99 00"),
        ("bot", "Готово! Бронь Полулюкса 8-10 апреля на имя Айгуль. Передаю менеджеру для подтверждения!"),
        ("operator", "Подтверждаю. До встречи в Чолпон-Ате 🌊"),
    ]),
    (8, "hotel", "completed", 0, [
        ("client", "У вас есть бассейн?"),
        ("bot", "Да, открытый бассейн с подогревом, работает 9:00-22:00. Включён в стоимость номера. Полотенца у бассейна выдаём бесплатно."),
        ("client", "Супер, спасибо"),
    ]),
    (10, "booking", "completed", 0, [
        ("client", "Стандарт на 12-14 апреля свободен?"),
        ("bot", "Да, Стандарт 12-14 апреля — 9 000 ₽ за 2 ночи. На кого оформить?"),
        ("client", "Семён Козлов, +996 700 33 44 55"),
        ("bot", "Принято! Передаю менеджеру для подтверждения!"),
        ("operator", "Подтверждаю, Семён."),
    ]),
    (11, "service", "completed", 0, [
        ("client", "Когда открывается ресторан?"),
        ("bot", "Ресторан работает 7:00-23:00. Завтрак с 7:00 до 10:30 включён в номер."),
    ]),
    (13, "booking", "completed", 0, [
        ("client", "Семья 4 человека, 15-18 апреля. Что подходит?"),
        ("bot", "Для 4х на 15-18 предлагаю 2 номера: Стандарт + Стандарт = 27 000 ₽ за 3 ночи. Или 1 семейный (если освободится — уточняю)."),
        ("client", "Давайте 2 Стандарта, оформляйте"),
        ("bot", "Имя и телефон бронирующего?"),
        ("client", "Татьяна Иванова, +996 700 12 34 56"),
        ("bot", "Записал! Передаю менеджеру для подтверждения!"),
        ("operator", "Подтверждаю 2 номера, Татьяна. Заезд с 14:00."),
    ]),
    (15, "general", "completed", 0, [
        ("client", "Спасибо за быстрый ответ!"),
        ("bot", "Всегда рады. Если возникнут вопросы перед заездом — напишите 🙂"),
    ]),
    (17, "booking", "completed", 0, [
        ("client", "Полулюкс на 19-21 апреля?"),
        ("bot", "Свободен. 7 200 ₽/ночь × 2 = 14 400 ₽. Имя и телефон?"),
        ("client", "Бектур, +996 555 22 33 44"),
        ("bot", "Готово! Передаю менеджеру для подтверждения!"),
        ("operator", "Подтверждаю, Бектур."),
    ]),
    (20, "service", "completed", 0, [
        ("client", "Можно ли с собакой?"),
        ("bot", "С маленькими животными до 8 кг — можно, доплата 500 ₽/сутки. С большими, к сожалению, нет."),
        ("client", "У меня той-терьер, ок"),
    ]),
    (22, "booking", "completed", 0, [
        ("client", "Двусп. номер на 23-26 апреля свободен?"),
        ("bot", "Да, Twin (двусп. кровать) 23-26 апреля — 4 500 ₽/ночь × 3 = 13 500 ₽. Имя и телефон?"),
        ("client", "Алина, +996 700 77 88 99"),
        ("bot", "Записал! Передаю менеджеру для подтверждения!"),
        ("operator", "Подтверждаю Twin, Алина."),
    ]),
    (24, "hotel", "completed", 0, [
        ("client", "До пляжа сколько идти?"),
        ("bot", "От нас до пляжа 7 минут пешком — 400 метров. Полотенца, лежаки даём в аренду на ресепшен (200 ₽/день)."),
    ]),
    (26, "booking", "completed", 0, [
        ("client", "Большая семья, 6 человек, 27-30 апреля"),
        ("bot", "На 6 гостей предлагаю 3 номера: 2 Стандарта + 1 Полулюкс. Итого 7 200 + 4 500 + 4 500 = 16 200 ₽/ночь × 3 = 48 600 ₽."),
        ("client", "Дороговато. Только Стандарты можно?"),
        ("bot", "3 Стандарта — 13 500 ₽/ночь × 3 = 40 500 ₽. На кого оформить?"),
        ("client", "Марат Османов, +996 555 44 55 66"),
        ("bot", "Готово! Передаю менеджеру для подтверждения!"),
        ("operator", "Подтверждаю, Марат. Жду 27 числа."),
    ]),
    (27, "booking", "active", 1, [
        ("client", "Бронь на 1-3 мая, Полулюкс?"),
        ("bot", "На 1-3 мая Полулюкс свободен. 7 200 ₽/ночь × 2 = 14 400 ₽. Имя и телефон?"),
        ("client", "Чингиз, +996 700 11 88 22"),
    ]),
    (28, "general", "active", 2, [
        ("client", "Здравствуйте"),
        ("bot", "Здравствуйте! Чем могу помочь? 😊"),
        ("client", "Я насчёт номера хотел спросить"),
    ]),
]


# (booking_day_in_april, amount_usd, nights, notes)
BOOKING_FIXTURES = [
    (5, 280, 2, "Стандарт 5-7 апреля"),
    (7, 720, 2, "Полулюкс 8-10 (3 гостя)"),
    (12, 360, 2, "Стандарт 12-14"),
    (15, 1200, 3, "2 номера семья 15-18"),
    (19, 480, 2, "Полулюкс 19-21"),
    (23, 360, 3, "Twin 23-26"),
    (27, 920, 3, "Семья 27-30 апреля"),
    (8, 180, 1, "Доп. ночь Полулюкс"),
    (14, 220, 1, "Поздний заезд"),
    (16, 380, 2, "Доп. бронь 17-19"),
    (21, 260, 2, "Стандарт 21-23"),
    (25, 320, 2, "Twin 25-27"),
]


async def main() -> None:
    async with AsyncSessionLocal() as db:
        # Owner — demo user (created by init_db.py)
        owner = (
            await db.execute(select(User).where(User.email == "demo@asystem.com"))
        ).scalar_one_or_none()
        if owner is None:
            print("ERROR: demo@asystem.com not found. Run `python init_db.py` first.")
            sys.exit(1)

        # Wipe previous demo state (idempotent)
        existing_hotel = (
            await db.execute(select(Hotel).where(Hotel.slug == HOTEL_SLUG))
        ).scalar_one_or_none()
        if existing_hotel is not None:
            # Cascade-delete conversations + messages + bookings
            convs = (await db.execute(
                select(Conversation).where(Conversation.hotel_id == existing_hotel.id)
            )).scalars().all()
            conv_ids = [c.id for c in convs]
            if conv_ids:
                await db.execute(delete(Message).where(Message.conversation_id.in_(conv_ids)))
                await db.execute(delete(ConfirmedBooking).where(
                    ConfirmedBooking.conversation_id.in_(conv_ids)
                ))
                await db.execute(delete(Conversation).where(Conversation.id.in_(conv_ids)))
            await db.execute(delete(Client).where(Client.hotel_id == existing_hotel.id))
            await db.delete(existing_hotel)
            await db.flush()

        # Fresh hotel — backdated activated_at
        activated = datetime(2026, 4, 3, 9, 30, tzinfo=timezone.utc)
        hotel = Hotel(
            owner_id=owner.id,
            name=HOTEL_NAME,
            slug=HOTEL_SLUG,
            description="Бутик-отель на 22 номера на северном берегу Иссык-Куля.",
            address="Чолпон-Ата, ул. Советская 18",
            phone="+996700123456",
            email="demo@hotel.kg",
            languages=["ru", "en", "ky"],
            communication_style="friendly",
            ai_model="anthropic/claude-3.5-haiku",
            monthly_budget=15.0,
            status="active",
            activated_at=activated,
            avg_booking_price_usd=120.0,
            sub_fee_usd=40.0,
            pms_kind="exely",
        )
        db.add(hotel)
        await db.flush()

        # One client all conversations belong to (keeps cross-dialog memory plausible)
        client = Client(
            hotel_id=hotel.id,
            telegram_id=CLIENT_TG_ID,
            telegram_username="ivan_pitchovich",
            name="Иван Петров",
            language="ru",
        )
        db.add(client)
        await db.flush()

        # Conversations across the month with realistic dialog content
        from datetime import timedelta as _td
        for day, category, status, unread, dialog in CONVERSATION_FIXTURES:
            base_ts = datetime(2026, 4, day, 14, 30, tzinfo=timezone.utc)
            last_msg_ts = base_ts + _td(minutes=len(dialog) * 2)
            last_preview = dialog[-1][1][:500]
            conv = Conversation(
                hotel_id=hotel.id,
                client_id=client.id,
                status=status,
                channel="telegram",
                category=category,
                last_message_at=last_msg_ts,
                last_message_preview=last_preview,
                unread_count=unread,
            )
            db.add(conv)
            await db.flush()

            # Each turn 2 minutes apart so timestamps look organic in the UI
            for idx, (sender, content) in enumerate(dialog):
                role = "assistant" if sender == "bot" else "user"
                msg_ts = base_ts + _td(minutes=idx * 2)
                msg = Message(
                    conversation_id=conv.id,
                    role=role,
                    sender=sender,
                    content=content,
                )
                # SQLAlchemy maps Message.created_at to server_default — we
                # override via direct attribute to keep the historical timestamp.
                msg.created_at = msg_ts
                db.add(msg)

        # Confirmed bookings — pinned to the first conversation for FK simplicity;
        # the report aggregates by hotel_id, conversation linkage is informational.
        first_conv_id = (await db.execute(
            select(Conversation.id).where(Conversation.hotel_id == hotel.id)
            .order_by(Conversation.id.asc()).limit(1)
        )).scalar_one()

        for day, amount, nights, notes in BOOKING_FIXTURES:
            db.add(ConfirmedBooking(
                conversation_id=first_conv_id,
                hotel_id=hotel.id,
                amount_usd=amount,
                nights=nights,
                notes=notes,
                confirmed_by_user_id=owner.id,
                confirmed_at=datetime(2026, 4, day, 18, 0, tzinfo=timezone.utc),
            ))

        await db.commit()

        total = sum(b[1] for b in BOOKING_FIXTURES)
        roi = total / hotel.sub_fee_usd
        print(f"DEMO seeded — Hotel id={hotel.id}, slug={HOTEL_SLUG}")
        print(f"  Conversations: {len(CONVERSATION_FIXTURES)}")
        print(f"  Confirmed bookings: {len(BOOKING_FIXTURES)} = ${total}")
        print(f"  ROI April 2026: {roi:.0f}x vs ${hotel.sub_fee_usd}/mo")
        print(f"  URL: /dashboard/hotels/{hotel.id}/reports?month=2026-04")


if __name__ == "__main__":
    asyncio.run(main())
