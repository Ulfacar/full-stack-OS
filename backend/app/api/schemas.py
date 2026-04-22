from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Auth schemas
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class User(BaseModel):
    id: int
    name: str
    email: str
    role: str = "admin"
    is_active: bool

    class Config:
        from_attributes = True


# Hotel schemas
class RoomCategory(BaseModel):
    name: str
    capacity: int
    price: int
    description: Optional[str] = None


class HotelRules(BaseModel):
    checkin: str = "14:00"
    checkout: str = "12:00"
    cancellation: Optional[str] = None
    paymentCards: bool = False
    paymentQR: bool = False
    paymentCash: bool = False
    pets: Optional[str] = None
    smoking: Optional[str] = None


class HotelAmenities(BaseModel):
    wifi: bool = False
    parking: bool = False
    breakfast: bool = False
    pool: bool = False
    transfer: bool = False
    excursions: bool = False
    conference: bool = False
    other: Optional[str] = None


class HotelPaymentDetails(BaseModel):
    """Optional payment requisites the bot can quote to guests.

    All fields are optional. When all fields are empty the field goes to
    DB as NULL and the bot uses the fail-loud safeguard — see
    response_processor.check_payment_placeholder.
    """
    bank_details: Optional[str] = None
    phone_for_payment: Optional[str] = None
    iban: Optional[str] = None
    notes: Optional[str] = None


class HotelCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None

    rooms: List[RoomCategory] = []
    rules: Optional[HotelRules] = None
    amenities: Optional[HotelAmenities] = None
    payment_details: Optional[HotelPaymentDetails] = None

    telegram_bot_token: Optional[str] = None
    whatsapp_phone: Optional[str] = None
    wappi_api_key: Optional[str] = None
    wappi_profile_id: Optional[str] = None

    ai_model: str = "anthropic/claude-3.5-haiku"
    system_prompt: Optional[str] = None
    communication_style: str = "friendly"
    languages: List[str] = ["ru", "en"]
    monthly_budget: float = 5.0


class HotelUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None

    rooms: Optional[List[RoomCategory]] = None
    rules: Optional[HotelRules] = None
    amenities: Optional[HotelAmenities] = None
    payment_details: Optional[HotelPaymentDetails] = None

    telegram_bot_token: Optional[str] = None
    whatsapp_phone: Optional[str] = None

    ai_model: Optional[str] = None
    system_prompt: Optional[str] = None
    communication_style: Optional[str] = None
    languages: Optional[List[str]] = None
    # is_active, monthly_budget, status — admin-only, managed via /admin/hotels/{id}/budget
    wappi_api_key: Optional[str] = None
    wappi_profile_id: Optional[str] = None


class Hotel(BaseModel):
    id: int
    owner_id: int
    name: str
    slug: str
    address: Optional[str]
    phone: Optional[str] = None
    email: Optional[str]
    website: Optional[str]
    description: Optional[str]

    has_telegram_bot: bool = False
    whatsapp_phone: Optional[str]
    ai_model: str
    system_prompt: Optional[str] = None

    rooms: Optional[List[dict]] = []
    rules: Optional[dict] = {}
    amenities: Optional[dict] = {}

    communication_style: str
    languages: List[str]
    is_active: bool
    monthly_budget: float = 5.0
    status: str = "demo"

    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

    @classmethod
    def model_validate(cls, obj, **kwargs):
        if hasattr(obj, 'telegram_bot_token'):
            obj.__dict__['has_telegram_bot'] = bool(obj.telegram_bot_token)
        return super().model_validate(obj, **kwargs)


class HotelList(BaseModel):
    id: int
    name: str
    slug: str
    ai_model: str
    is_active: bool
    status: str = "demo"
    monthly_budget: float = 5.0
    has_telegram_bot: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def model_validate(cls, obj, **kwargs):
        if hasattr(obj, 'telegram_bot_token'):
            obj.__dict__['has_telegram_bot'] = bool(obj.telegram_bot_token)
        return super().model_validate(obj, **kwargs)


# Admin schemas
class HotelWithStats(BaseModel):
    id: int
    name: str
    slug: str
    ai_model: str
    communication_style: str
    languages: List[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    status: str = "demo"
    monthly_budget: float = 5.0
    budget_used: float = 0.0
    budget_remaining: float = 5.0
    conversations_month: int = 0
    active_conversations: int = 0
    ai_cost_month: float = 0.0
    last_activity: Optional[str] = None
    requests_handled: int = 0

    class Config:
        from_attributes = True


class AdminStats(BaseModel):
    total_hotels: int
    active_hotels: int
    total_conversations_month: int
    total_ai_cost_month: float
    openrouter_balance: float


class AIUsageDaily(BaseModel):
    date: str
    conversations: int
    prompt_tokens: int
    completion_tokens: int
    cost: float


class BillingRecord(BaseModel):
    id: int
    hotel_id: int
    hotel_name: str
    month: str
    amount: int
    status: str
    paid_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class ChannelBreakdown(BaseModel):
    telegram: int = 0
    whatsapp: int = 0

class DailyConversations(BaseModel):
    date: str
    count: int

class HotelStatsResponse(BaseModel):
    messages_total: int
    conversations_total: int
    conversations_month: int
    requests_handled: int
    automation_rate: int
    needs_operator_count: int = 0
    channels: ChannelBreakdown = ChannelBreakdown()
    daily: List[DailyConversations] = []
