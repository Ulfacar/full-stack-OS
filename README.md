# 🤖 Asystem Platform - AI Hotel Assistants SaaS

Multi-tenant SaaS platform for managing AI-powered hotel assistants via Telegram and WhatsApp.

## 🚀 Quick Start

### Local Development

```bash
# 1. Install backend dependencies
cd backend
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY

# 3. Start PostgreSQL
docker run --name asystem-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15

# 4. Initialize database
python init_db.py

# 5. Start backend
uvicorn app.main:app --reload

# 6. Install frontend dependencies
cd ../frontend-platform
npm install

# 7. Start frontend
npm run dev
```

Visit: http://localhost:3000

**Demo login:**
- Email: `demo@asystem.com`
- Password: `demo123`

---

## 📦 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Async ORM
- **PostgreSQL** - Database
- **OpenRouter** - AI models (DeepSeek, GPT-4, Claude)
- **python-telegram-bot** - Telegram integration

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Query** - Data fetching

---

## 🌐 Deployment

**Production deployment guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

### Recommended Setup:
- **Backend + PostgreSQL:** Railway ($10/month)
- **Frontend:** Vercel (Free)
- **AI Models:** OpenRouter (Pay-as-you-go)

---

## 📚 Project Structure

```
.
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Config, security
│   │   ├── db/          # Database models
│   │   └── services/    # Business logic
│   ├── alembic/         # Database migrations
│   └── requirements.txt
│
├── frontend-platform/   # Next.js frontend
│   ├── app/            # Pages & routes
│   ├── components/     # React components
│   └── lib/            # Utilities
│
└── docs/               # Documentation
```

---

## 🔑 Features

✅ **Multi-tenant architecture** - One platform, multiple hotels
✅ **AI-powered responses** - DeepSeek, GPT-4, Claude via OpenRouter
✅ **Telegram integration** - Automatic webhook setup
✅ **Context-aware conversations** - Remembers chat history
✅ **Customizable system prompts** - Auto-generated from hotel data
✅ **Hotel wizard** - Easy onboarding for new hotels
✅ **Real-time messaging** - Instant AI responses

---

## 🛠️ Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/asystem

# Auth
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# OpenRouter API
OPENROUTER_API_KEY=your-openrouter-api-key

# Webhooks
WEBHOOK_BASE_URL=https://your-domain.com

# CORS
BACKEND_CORS_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📖 API Documentation

Once backend is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🆘 Support

- 📧 Email: support@asystem.com
- 💬 Telegram: @asystem_support
- 📚 Docs: https://docs.asystem.com

---

## 🎯 Roadmap

- [x] Telegram integration
- [x] Multi-tenant architecture
- [x] AI-powered responses
- [x] Hotel wizard
- [ ] WhatsApp integration
- [ ] Payment processing (Stripe)
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Voice messages support
- [ ] Admin panel

---

**Built with ❤️ for hotel owners who want to automate guest communication**
