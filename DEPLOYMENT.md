# 🚀 Инструкция по деплою на Railway

## Подготовка (уже сделано ✅)

- [x] Создан аккаунт на Railway.app
- [x] Создан GitHub репозиторий
- [x] Добавлен OpenRouter API ключ в `.env`
- [x] Созданы конфигурационные файлы (`Procfile`, `railway.json`)
- [x] Настроен `.gitignore`

---

## 📦 Шаг 1: Загрузка кода в GitHub

### 1.1 Инициализировать Git (если ещё не сделано)

```bash
git init
git add .
git commit -m "Initial commit: Asystem Platform - AI Hotel Assistants SaaS"
```

### 1.2 Подключить GitHub репозиторий

```bash
# Замените YOUR_USERNAME и YOUR_REPO на ваши данные
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## 🚂 Шаг 2: Деплой Backend на Railway

### 2.1 Создать новый проект

1. Откройте https://railway.app/dashboard
2. Нажмите **"New Project"**
3. Выберите **"Deploy from GitHub repo"**
4. Выберите ваш репозиторий
5. Railway автоматически обнаружит Python приложение

### 2.2 Добавить PostgreSQL базу данных

1. В вашем проекте нажмите **"+ New"**
2. Выберите **"Database"** → **"Add PostgreSQL"**
3. Railway автоматически создаст базу и подключит её

### 2.3 Настроить переменные окружения

Перейдите в **Settings → Variables** и добавьте:

```env
# OpenRouter API (ОБЯЗАТЕЛЬНО!)
OPENROUTER_API_KEY=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

# Webhook URL (заполните после получения Railway URL)
WEBHOOK_BASE_URL=https://your-backend.up.railway.app

# Auth (смените на случайную строку!)
SECRET_KEY=ваш-случайный-секретный-ключ-минимум-32-символа

# CORS (добавьте ваш frontend URL после деплоя)
BACKEND_CORS_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app

# Database URL - Railway заполнит автоматически
# DATABASE_URL=postgresql+asyncpg://... (автоматически из PostgreSQL)
```

**ВАЖНО:**
- `SECRET_KEY` - смените на случайную строку (минимум 32 символа)
- `WEBHOOK_BASE_URL` - скопируйте из Railway после деплоя
- `DATABASE_URL` - Railway заполнит автоматически при добавлении PostgreSQL

### 2.4 Настроить Root Directory для Backend

1. Перейдите в **Settings**
2. В разделе **"Root Directory"** укажите: `backend`
3. Сохраните

### 2.5 Получить публичный URL

1. После деплоя перейдите в **Settings → Domains**
2. Нажмите **"Generate Domain"**
3. Скопируйте URL (например: `https://asystem-backend-production.up.railway.app`)
4. Обновите `WEBHOOK_BASE_URL` в переменных окружения

### 2.6 Инициализировать базу данных

После деплоя выполните команду в Railway Console:

```bash
python init_db.py
```

Это создаст все таблицы и demo пользователя.

---

## 🌐 Шаг 3: Деплой Frontend на Vercel

### 3.1 Установить Vercel CLI (опционально)

```bash
npm install -g vercel
```

### 3.2 Настроить переменные окружения

Создайте файл `frontend-platform/.env.production`:

```env
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```

**Замените `your-backend.up.railway.app` на ваш Railway URL!**

### 3.3 Задеплоить на Vercel

**Вариант A: Через Web UI (проще)**

1. Откройте https://vercel.com/new
2. Импортируйте ваш GitHub репозиторий
3. Настройте проект:
   - **Root Directory**: `frontend-platform`
   - **Framework Preset**: Next.js
4. Добавьте переменную окружения:
   - `NEXT_PUBLIC_API_URL` = ваш Railway URL
5. Нажмите **"Deploy"**

**Вариант B: Через CLI**

```bash
cd frontend-platform
vercel
# Следуйте инструкциям
```

### 3.4 Получить Vercel URL

После деплоя скопируйте URL (например: `https://asystem-platform.vercel.app`)

### 3.5 Обновить CORS в Railway

Вернитесь в Railway → Backend → Variables и обновите:

```env
BACKEND_CORS_ORIGINS=http://localhost:3000,https://asystem-platform.vercel.app
```

---

## ✅ Шаг 4: Проверка работы

### 4.1 Проверить Backend

Откройте: `https://your-backend.up.railway.app/docs`

Должна открыться Swagger документация API.

### 4.2 Проверить Frontend

1. Откройте ваш Vercel URL
2. Нажмите **"⚡ Быстрый вход"**
3. Email: `demo@asystem.com` / Password: `demo123`
4. Должен открыться Dashboard

### 4.3 Создать тестовый отель

1. В Dashboard нажмите **"Создать отель"**
2. Заполните данные
3. Укажите Telegram bot token (из @BotFather)
4. Сохраните

Webhook автоматически зарегистрируется!

### 4.4 Протестировать Telegram бота

Напишите сообщение вашему боту в Telegram. Он должен ответить! 🎉

---

## 🔧 Полезные команды Railway

```bash
# Логи backend
railway logs

# Подключиться к PostgreSQL
railway run psql

# Выполнить команду в контейнере
railway run python init_db.py
```

---

## 📝 Что дальше?

- [ ] Добавить custom domain (опционально)
- [ ] Настроить мониторинг (Railway Metrics)
- [ ] Добавить CI/CD через GitHub Actions
- [ ] Настроить резервное копирование БД

---

## ❓ Проблемы?

### Backend не запускается

1. Проверьте логи: `railway logs`
2. Убедитесь что `Root Directory = backend`
3. Проверьте переменные окружения

### Telegram webhook не работает

1. Проверьте `WEBHOOK_BASE_URL` в Railway Variables
2. Убедитесь что URL публичный и доступен
3. Проверьте bot token

### Frontend не может подключиться к Backend

1. Проверьте `NEXT_PUBLIC_API_URL` в Vercel
2. Убедитесь что backend URL добавлен в `BACKEND_CORS_ORIGINS`
3. Перезадеплойте frontend

---

## 💰 Стоимость

**Railway:**
- PostgreSQL: ~$5/месяц
- Backend: ~$5/месяц
- **Итого:** ~$10/месяц

**Vercel:**
- Frontend: Бесплатно (Hobby plan)

**OpenRouter:**
- Pay-as-you-go (DeepSeek очень дешёвый - $0.27/1M tokens)

---

## 🎉 Готово!

Ваш AI Hotel Assistant SaaS работает в production!

Можете делиться ссылкой с клиентами и принимать платежи! 💰
