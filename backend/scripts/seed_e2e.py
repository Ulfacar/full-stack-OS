"""Seed test data for local E2E of #27 admin panel.

Idempotent — running twice produces the same state. Assumes
``init_db.py`` has already been run (demo@asystem.com exists as sales user).

Creates:
- 1 hotel "E2E Test Hotel" owned by user id=1 (demo@asystem.com)
- 1 client "Иван Тестовый"
- 1 conversation (category=booking, status=active)
- 6 realistic messages (client asks price, bot answers, client asks details, bot answers)
- unread_count=2 so the UI badge shows up

Run: `python scripts/seed_e2e.py`
"""
import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)
if BACKEND not in sys.path:
    sys.path.insert(0, BACKEND)

from sqlalchemy import select  # noqa: E402

from app.db.database import AsyncSessionLocal  # noqa: E402
from app.db.models import Client, Conversation, Hotel, Message, User  # noqa: E402


HOTEL_SLUG = "e2e-test-hotel"
HOTEL_NAME = "E2E Test Hotel"


async def main() -> None:
    async with AsyncSessionLocal() as db:
        # 1. Find demo user
        demo = (
            await db.execute(select(User).where(User.email == "demo@asystem.com"))
        ).scalar_one_or_none()
        if demo is None:
            print("ERROR: demo@asystem.com not found — run `python init_db.py` first")
            sys.exit(1)

        # 2. Hotel (idempotent)
        hotel = (
            await db.execute(select(Hotel).where(Hotel.slug == HOTEL_SLUG))
        ).scalar_one_or_none()
        if hotel is None:
            hotel = Hotel(
                owner_id=demo.id,
                name=HOTEL_NAME,
                slug=HOTEL_SLUG,
                address="Иссык-Куль, Чолпон-Ата",
                phone="+996 555 123 456",
                email="test@e2e.local",
                description="Тестовый отель для E2E админки диалогов",
                rooms=[
                    {"name": "Стандарт", "capacity": 2, "price": 4500, "description": "двуспальная или раздельные"},
                    {"name": "Полулюкс", "capacity": 3, "price": 7200, "description": "с балконом на озеро"},
                ],
                languages=["ru", "en", "ky"],
                status="active",
                is_active=True,
                manager_name="Назира",
                manager_telegram_id="0",
            )
            db.add(hotel)
            await db.flush()
            print(f"CREATE hotel id={hotel.id}")
        else:
            print(f"EXISTS hotel id={hotel.id}")

        # 3. Client
        client = (
            await db.execute(
                select(Client).where(
                    Client.hotel_id == hotel.id, Client.telegram_id == "777111"
                )
            )
        ).scalar_one_or_none()
        if client is None:
            client = Client(
                hotel_id=hotel.id,
                telegram_id="777111",
                telegram_username="ivan_test",
                name="Иван Тестовый",
                language="ru",
            )
            db.add(client)
            await db.flush()
            print(f"CREATE client id={client.id}")
        else:
            print(f"EXISTS client id={client.id}")

        # 4. Conversation — re-seed cleanly (delete then recreate) for repeatability
        existing = (
            await db.execute(
                select(Conversation).where(
                    Conversation.hotel_id == hotel.id, Conversation.client_id == client.id
                )
            )
        ).scalars().all()
        for conv in existing:
            # Cascade-delete messages first (no ON DELETE in model)
            msgs = (
                await db.execute(select(Message).where(Message.conversation_id == conv.id))
            ).scalars().all()
            for m in msgs:
                await db.delete(m)
            await db.delete(conv)
        await db.flush()

        now = datetime.now(timezone.utc)
        conv = Conversation(
            hotel_id=hotel.id,
            client_id=client.id,
            status="active",
            channel="telegram",
            category="booking",
            last_message_at=now,
            last_message_preview="Хорошо, давайте двуспальную. А завтрак включён?",
            unread_count=2,
        )
        db.add(conv)
        await db.flush()
        print(f"CREATE conversation id={conv.id}")

        # 5. Messages — realistic booking dialog
        base = now - timedelta(minutes=12)
        seed_messages = [
            (0, "client", "user", "Здравствуйте! Какие номера свободны 15-17 июня на двоих?"),
            (1, "bot", "assistant",
             "Здравствуйте! На 15-17 июня свободны:\n• Стандарт — 4 500 ₽/ночь (двуспальная или раздельные)\n• Полулюкс — 7 200 ₽/ночь (с балконом на озеро)\n\nНа кого оформить бронь?"),
            (3, "client", "user", "А разница чем? Полулюкс сильно лучше?"),
            (4, "bot", "assistant",
             "В Полулюксе балкон с видом на озеро, площадь 27 м² вместо 20 м², халаты и тапочки в комплекте. В Стандарте всё базовое: кондиционер, душ, фен, сейф, wi-fi.\n\nЕсли виды важны — лучше Полулюкс."),
            (8, "client", "user", "Хорошо, давайте двуспальную."),
            (11, "client", "user", "А завтрак включён?"),
        ]
        for offset_min, sender, role, content in seed_messages:
            db.add(
                Message(
                    conversation_id=conv.id,
                    role=role,
                    sender=sender,
                    content=content,
                    created_at=base + timedelta(minutes=offset_min),
                )
            )

        await db.commit()
        print(f"SEED complete — open /dashboard/hotels/{hotel.id}/conversations")
        print(f"  Hotel ID: {hotel.id}")
        print(f"  Conversation ID: {conv.id}")
        print(f"  Login: demo@asystem.com / demo123")


if __name__ == "__main__":
    asyncio.run(main())
