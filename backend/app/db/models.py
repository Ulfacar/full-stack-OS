from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="admin")  # admin, sales
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    hotels = relationship("Hotel", back_populates="owner")


class Hotel(Base):
    __tablename__ = "hotels"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Basic info
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True)
    address = Column(String(500))
    phone = Column(String(50))
    email = Column(String(255))
    website = Column(String(500))
    description = Column(Text)

    # Bot configuration
    telegram_bot_token = Column(String(255), unique=True, index=True)
    whatsapp_phone = Column(String(50))
    wappi_api_key = Column(String(255))
    wappi_profile_id = Column(String(100))
    ai_model = Column(String(100), default="anthropic/claude-3.5-haiku")
    system_prompt = Column(Text)

    # Hotel data (JSON for flexibility)
    rooms = Column(JSON)  # [{name, capacity, price, description}]
    rules = Column(JSON)  # {checkin, checkout, cancellation, etc}
    amenities = Column(JSON)  # {wifi, parking, breakfast, etc}

    # Budget
    monthly_budget = Column(Float, default=5.0)  # Monthly limit in USD
    status = Column(String(20), default="demo")  # demo, active, suspended

    # Settings
    communication_style = Column(String(50), default="friendly")
    languages = Column(JSON, default=["ru", "en"])
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="hotels")
    clients = relationship("Client", back_populates="hotel")
    conversations = relationship("Conversation", back_populates="hotel")


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"), nullable=False)

    # Client info
    telegram_id = Column(String(100), index=True)
    telegram_username = Column(String(255))
    whatsapp_phone = Column(String(50))

    name = Column(String(255))
    language = Column(String(10))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    hotel = relationship("Hotel", back_populates="clients")
    conversations = relationship("Conversation", back_populates="client")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)

    status = Column(String(50), default="active")  # active, completed, needs_operator
    channel = Column(String(50))  # telegram, whatsapp

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    hotel = relationship("Hotel", back_populates="conversations")
    client = relationship("Client", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)

    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")


class AIUsage(Base):
    __tablename__ = "ai_usage"

    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"), nullable=False)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=True)

    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    model = Column(String(100))
    cost_usd = Column(Float, default=0.0)  # Pre-calculated cost in USD

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    hotel = relationship("Hotel")
    conversation = relationship("Conversation")


class Billing(Base):
    __tablename__ = "billing"

    id = Column(Integer, primary_key=True, index=True)
    hotel_id = Column(Integer, ForeignKey("hotels.id"), nullable=False)

    month = Column(String(7), nullable=False)  # "2026-04"
    amount = Column(Integer, default=20)
    status = Column(String(20), default="pending")  # paid, pending, overdue
    paid_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    hotel = relationship("Hotel")


class Application(Base):
    """Заявка на создание бота от клиента."""
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String(20), default="pending")  # pending, configuring, active, rejected
    hotel_name = Column(String(255), nullable=False)
    contact_name = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    contact_email = Column(String(255), nullable=True)
    form_data = Column(JSON, nullable=True)  # Все данные формы (номера, цены, правила, удобства)
    generated_prompt = Column(Text, nullable=True)  # Сгенерированный промпт
    hotel_id = Column(Integer, ForeignKey("hotels.id"), nullable=True)  # Связь после активации

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    hotel = relationship("Hotel")
