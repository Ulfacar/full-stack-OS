# Frontend Redesign — Onboarding

> Этот документ предназначен для onboarding'а нового Claude/AI-агента, который будет помогать с переделкой фронта Ex-Machina. Скопируй содержимое целиком в первое сообщение новой сессии.

---

## Контекст проекта

Ex-Machina — SaaS-платформа AI-ботов для мини-отелей в Кыргызстане (15-40 номеров).
Команда: Алан (backend, FastAPI) + Эмир (frontend). Сейчас задача — переосмыслить дизайн фронта.

**Repo:** https://github.com/Ulfacar/Ex-Machina (публичный)
**Live:** https://exmachina.up.railway.app/
**Stack:** FastAPI + Next.js 14 App Router + Postgres + Railway

---

## Перед началом прочитать

В порядке приоритета:

1. `docs/SESSION_RECAP_2026_04_28.md` — последний полный recap. 13 stories закрыты за день, описано что есть в проде.
2. `docs/SESSION_RECAP_2026_04_25.md` — предыдущая сессия для полноты картины.
3. `docs/sales/pitch_2026_05_02.md` — живой pitch инвестору в субботу. Описывает demo-flow, какие страницы инвестор увидит. Это то что работает прямо сейчас и должно продолжать работать.

---

## Структура фронта

```
frontend-platform/
├── app/                      # Next.js App Router — все страницы
│   ├── page.tsx              # Лендинг
│   ├── login/                # Логин
│   ├── register/             # Регистрация
│   ├── dashboard/            # Админ-панель
│   │   ├── hotels/           # Список + детали отелей + диалоги + reports
│   │   ├── billing/
│   │   ├── stats/
│   │   └── users/
│   ├── sales/                # CRM для продажников
│   ├── hotels/[id]/          # Публичные демо отелей
│   ├── share/[token]/        # Партнёрская шара (read-only)
│   ├── compare/              # Конкурентная таблица
│   ├── cases/ton-azure/      # Case study
│   ├── faq/                  # FAQ для владельцев
│   ├── guides/wa-onboarding/ # Гайд по WhatsApp
│   └── create-bot/           # Визард sales-заявки (5 шагов)
├── components/
│   └── hotel/HotelWizard.tsx # Главный визард создания отеля (5 шагов)
└── lib/
    ├── api.ts                # axios + JWT auto-attach
    ├── types.ts              # Все типы (Hotel, User, Lead, Conversation, Message и т.д.)
    ├── conversationsApi.ts   # Endpoints диалогов
    ├── salesApi.ts           # Endpoints sales-панели
    └── useCurrentUser.ts     # Zustand-хук текущего юзера
```

**Дизайн сейчас:** тёмная тема (`#0A0A0A` фон / `#FAFAFA` текст / `#3B82F6` акцент). Можешь не следовать этому — задача переосмыслить.

---

## Что НЕ трогать

- **Backend (`backend/`).** API готов, работает на проде. Все используемые endpoints видны в `lib/api.ts` и `lib/types.ts`. Если нужен новый endpoint — спросить Алана, он добавит.
- **Логика бизнес-фич.** Многотенантность, JWT, шифрование Fernet, webhook-secret-token — всё уже работает. Переделка чисто визуальная/UX.

---

## Известные дефекты в текущем UI

- На `/dashboard/hotels/{id}`: кнопки «Подключить каналы» и «Зарегистрировать webhook» визуально кликаются, но не отправляют запрос — handler где-то отвалился. Если по дороге redesign'а это починится органически — отлично. Полная история бага: Trello-карточка `BUG: telegram_bot_token не сохраняется` https://trello.com/c/ekRTnSvs.
- На `/dashboard/hotels`: кнопка «Создать отель» появляется только когда список пуст. После первого отеля кнопку добавить нужно явно.

---

## Запуск локально

```bash
cd frontend-platform
npm install
npm run dev
# → http://localhost:3000
```

`NEXT_PUBLIC_API_URL` по умолчанию указывает на prod backend (`exmachina-api.up.railway.app`), так что фронт сразу работает с живыми данными prod. Если нужен локальный backend — Алан подскажет.

Логины для теста на prod:
- demo@asystem.com (admin) — пароль через Алана
- alanbesev@gmail.com (sales)

---

## Trello / задачи

`https://trello.com/b/4Dq30xBi/ex-machina` — общая доска проекта.
Backlog содержит карточки которые могут быть полезны для frontend контекста (`#1 Лендинг polish`, `#22 Multi-manager роли`, `#19 BotFather GIF`, etc).

---

## Контакт

Вопросы по бэку, бизнес-логике, доступам — Алану.
