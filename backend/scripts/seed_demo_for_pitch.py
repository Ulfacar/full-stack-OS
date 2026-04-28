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


CONVERSATION_FIXTURES = [
    # (day, category, last_message_preview, status, unread)
    (3, "booking", "Здравствуйте, есть номера на 5-7 апреля?", "completed", 0),
    (5, "booking", "Полулюкс на 8-10 — 3 гостя", "completed", 0),
    (8, "hotel", "У вас есть бассейн?", "completed", 0),
    (10, "booking", "Стандарт на 12-14 апреля", "completed", 0),
    (11, "service", "Когда открывается ресторан?", "completed", 0),
    (13, "booking", "Семья из 4х человек, 15-18 апреля", "completed", 0),
    (15, "general", "Спасибо за быстрый ответ!", "completed", 0),
    (17, "booking", "Полулюкс на 19-21 апреля", "completed", 0),
    (20, "service", "Можно ли с собакой?", "completed", 0),
    (22, "booking", "Двусторонний номер на 23-26", "completed", 0),
    (24, "hotel", "До пляжа сколько идти?", "completed", 0),
    (26, "booking", "Большая семья, 27-30 апреля", "completed", 0),
    (27, "booking", "Бронь на 1-3 мая", "active", 1),
    (28, "general", "Здравствуйте", "active", 2),
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

        # Conversations across the month
        for day, category, preview, status, unread in CONVERSATION_FIXTURES:
            ts = datetime(2026, 4, day, 14, 30, tzinfo=timezone.utc)
            conv = Conversation(
                hotel_id=hotel.id,
                client_id=client.id,
                status=status,
                channel="telegram",
                category=category,
                last_message_at=ts,
                last_message_preview=preview,
                unread_count=unread,
            )
            db.add(conv)
            await db.flush()
            # One message per conversation just so the inbox UI is not empty
            db.add(Message(
                conversation_id=conv.id,
                role="user",
                sender="client",
                content=preview,
            ))

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
