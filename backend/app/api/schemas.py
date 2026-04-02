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


class HotelCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: str
    email: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None

    rooms: List[RoomCategory] = []
    rules: Optional[HotelRules] = None
    amenities: Optional[HotelAmenities] = None

    telegram_bot_token: str
    whatsapp_phone: Optional[str] = None

    ai_model: str = "deepseek/deepseek-chat"
    system_prompt: str
    communication_style: str = "friendly"
    languages: List[str] = ["ru", "en"]


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

    telegram_bot_token: Optional[str] = None
    whatsapp_phone: Optional[str] = None

    ai_model: Optional[str] = None
    system_prompt: Optional[str] = None
    communication_style: Optional[str] = None
    languages: Optional[List[str]] = None
    is_active: Optional[bool] = None


class Hotel(BaseModel):
    id: int
    owner_id: int
    name: str
    slug: str
    address: Optional[str]
    phone: str
    email: Optional[str]
    website: Optional[str]
    description: Optional[str]

    telegram_bot_token: Optional[str]
    whatsapp_phone: Optional[str]
    ai_model: str
    system_prompt: str

    rooms: Optional[List[dict]] = []
    rules: Optional[dict] = {}
    amenities: Optional[dict] = {}

    communication_style: str
    languages: List[str]
    is_active: bool

    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class HotelList(BaseModel):
    id: int
    name: str
    slug: str
    ai_model: str
    is_active: bool
    telegram_bot_token: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
