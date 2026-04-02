# Asystem Platform - Backend

Multi-tenant platform for managing hotel AI assistants.

## Tech Stack

- **FastAPI** - Web framework
- **SQLAlchemy** - ORM with async support
- **PostgreSQL** - Database
- **Alembic** - Database migrations
- **OpenRouter** - AI models (DeepSeek, GPT-4o, Claude)
- **python-telegram-bot** - Telegram integration
- **JWT** - Authentication

## Setup

### 1. Create virtual environment

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:
- Set `DATABASE_URL` for PostgreSQL
- Set `SECRET_KEY` (random string)
- Set `OPENROUTER_API_KEY`

### 4. Start PostgreSQL

```bash
docker run --name asystem-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
```

Or install PostgreSQL locally and create database:

```sql
CREATE DATABASE asystem;
```

### 5. Initialize database

```bash
python init_db.py
```

### 6. Run server

```bash
uvicorn app.main:app --reload --port 8000
```

API will be available at http://localhost:8000

Docs: http://localhost:8000/docs

## Database Schema

### Users
- id, name, email, hashed_password
- One user → many hotels

### Hotels
- id, owner_id, name, slug
- Basic info: address, phone, email, website, description
- Bot config: telegram_bot_token, ai_model, system_prompt
- Hotel data: rooms (JSON), rules (JSON), amenities (JSON)
- Settings: communication_style, languages, is_active

### Clients
- id, hotel_id, telegram_id, whatsapp_phone
- name, language

### Conversations
- id, hotel_id, client_id
- status, channel

### Messages
- id, conversation_id
- role (user/assistant/system), content

## API Endpoints

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (returns JWT token)

### Hotels
- `GET /hotels` - List user's hotels
- `POST /hotels` - Create new hotel
- `GET /hotels/{id}` - Get hotel details
- `PUT /hotels/{id}` - Update hotel
- `DELETE /hotels/{id}` - Delete hotel

### Telegram Webhooks (TBD)
- `POST /webhooks/telegram/{hotel_slug}` - Receive messages

## Multi-Tenant Architecture

Each hotel has:
- Unique slug (URL-friendly identifier)
- Own Telegram bot token
- Own system_prompt (generated from hotel data)
- Own AI model selection
- Own clients, conversations, messages

One backend serves ALL hotels with isolated data.

## Development

### Create migration

```bash
alembic revision --autogenerate -m "description"
```

### Run migrations

```bash
alembic upgrade head
```

### Rollback

```bash
alembic downgrade -1
```

## Next Steps

- [ ] Implement Telegram webhook handler
- [ ] Integrate OpenRouter for AI responses
- [ ] Add WhatsApp support via Wappi Pro
- [ ] Implement conversation history management
- [ ] Add analytics endpoints
