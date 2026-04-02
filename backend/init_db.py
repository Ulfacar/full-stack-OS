"""
Initialize database - create all tables
Run: python init_db.py
"""
import asyncio
from app.db.database import engine, Base
from app.db.models import User, Hotel, Client, Conversation, Message


async def init_db():
    async with engine.begin() as conn:
        # Drop all tables (CAUTION: This will delete all data!)
        # await conn.run_sync(Base.metadata.drop_all)

        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

    print("✅ Database initialized successfully!")
    print("Tables created: users, hotels, clients, conversations, messages")


if __name__ == "__main__":
    asyncio.run(init_db())
