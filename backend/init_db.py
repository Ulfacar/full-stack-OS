"""
Initialize database - create all tables and demo user
Run: python init_db.py
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import engine, Base, AsyncSessionLocal
from app.db.models import User, Hotel, Client, Conversation, Message, ConfirmedBooking, ShareLink
from app.core.security import get_password_hash


async def init_db():
    async with engine.begin() as conn:
        # Drop all tables (CAUTION: This will delete all data!)
        # await conn.run_sync(Base.metadata.drop_all)

        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

    print("[OK] Database initialized successfully!")
    print("Tables created: users, hotels, clients, conversations, messages")

    # Create demo user
    async with AsyncSessionLocal() as session:
        # Check if demo user already exists
        result = await session.execute(
            select(User).where(User.email == "demo@asystem.com")
        )
        existing_user = result.scalar_one_or_none()

        if not existing_user:
            demo_user = User(
                name="Demo User",
                email="demo@asystem.com",
                hashed_password=get_password_hash("demo123"),
                is_active=True
            )
            session.add(demo_user)
            await session.commit()
            print("[OK] Demo user created: demo@asystem.com / demo123")
        else:
            print("[INFO] Demo user already exists")


if __name__ == "__main__":
    asyncio.run(init_db())
