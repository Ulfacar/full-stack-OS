# Sales-визард E2E QA — 2026-04-18

## Что сделано

1. **E2E прогон** визарда `/create-bot` через Playwright MCP на локальном стеке под ролью `sales` (demo@asystem.com / demo123).
2. **Найдено и исправлено** 2 бага в `frontend-platform/app/create-bot/page.tsx` при сабмите заявки.
3. **Коммит `e61ebbe`** зафикшен и запушен в `origin/main` — Railway пересоберёт авто.

## Локальный стек (новый recipe)

Prod `exmachina.up.railway.app` требует invite code, демо-креды вернули 401. Docker daemon не запущен, Postgres не установлен. Решение — SQLite + два dep-фикса:

- `pip install "bcrypt==4.0.1"` — passlib 1.7.4 падает на bcrypt 5.x (`AttributeError: module 'bcrypt' has no attribute '__about__'`, затем `password cannot be longer than 72 bytes`).
- `pip install "pydantic[email]"` — uvicorn не стартует без email-validator (EmailStr в UserCreate).
- `backend/.env`: `DEBUG=true`, `DATABASE_URL=sqlite+aiosqlite:///./dev.db`, Fernet ключ через `cryptography`, dummy `OPENROUTER_API_KEY`.
- `python init_db.py` → создаёт `demo@asystem.com / demo123` c `role=sales` (default из модели).
- `frontend-platform/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000`, `npm run dev`.

Модели Hotel/etc используют обычный `JSON` (не JSONB), без ARRAY/UUID — SQLite полностью совместим. Миграции не гонял, `Base.metadata.create_all` хватило для QA.

## E2E-флоу (Playwright MCP)

1. `http://localhost:3000/login` → «Быстрый вход (demo)» → post-login routing закинул на `/sales`.
2. Sidebar показал только sales-роуты: Главная / Создать бота / Мои лиды / Настройки. Stats 0/0/0/0, пустой список лидов.
3. `/create-bot`: «Заполнить демо (Ton Azure)» скипнул на Step 4. Прошёл назад — все шаги 1→4 и обратно, данные сохранились.
4. Preview-чат: dummy OPENROUTER → UI отдал «Извините, произошла ошибка» без краша. Graceful fallback работает.
5. `Отправить заявку` → POST `/applications` → редирект на `/sales/leads/1`. Карточка лида показала контакты, 3 номера с ценами, сгенерённый системный промпт.
6. Home обновил stats: Всего 1 / Ожидают 1. Последний лид отображается.

## Найденные баги

### Bug 1: системный промпт начинается с `«отель»`

Снизу фрагмент сгенерённого промпта на лиде #1:

```
Ты — AI-ассистент отеля «отель». Отвечай КОРОТКО и ПО ДЕЛУ...
```

Ожидалось `«Ton Azure»`. Корень: `ai_service.generate_system_prompt(form_data)` на бэкенде берёт `form_data.get('name', 'отель')`. Фронт в `submitApplication` не клал `name` в `form_data` — вместо этого слал `hotel_name` отдельным полем на уровень выше. Бэкенд fallback-ил на литерал `«отель»`.

Косвенно пострадали **контакты в промпте** — `phone` и `email` тоже не попадали в `form_data`, секция `Контакты: тел..., email...` вообще отсутствовала.

### Bug 2: `transfer: false` захардкожен

```js
amenities: { ..., transfer: false, breakfast: form.breakfast }
```

`form.transfer` игнорировался. В демо Ton Azure `transfer: true`, но в БД и в промпт улетало `false` → в секции `УДОБСТВА` не было «трансфер».

## Фикс

`frontend-platform/app/create-bot/page.tsx:73`, одна строка:

```diff
- form_data: { description: form.description, address: form.address, rooms: form.rooms, rules: {...}, amenities: { wifi: form.wifi, parking: form.parking, pool: form.pool, restaurant: form.restaurant, transfer: false, breakfast: form.breakfast }, communication_style: form.communicationStyle }
+ form_data: { name: form.hotelName, description: form.description, address: form.address, phone: form.phone, email: form.email, rooms: form.rooms, rules: {...}, amenities: { wifi: form.wifi, parking: form.parking, pool: form.pool, restaurant: form.restaurant, transfer: form.transfer, breakfast: form.breakfast }, communication_style: form.communicationStyle }
```

## Верификация фикса

Повторный прогон визарда → создан лид #2. На карточке:

- Промпт начинается с `Ты — AI-ассистент отеля «Ton Azure»`.
- Появилась строка `Контакты: тел: +996 555 123 456, email: tonazure@mail.com`.
- В секции `УДОБСТВА: Wi-Fi, парковка, завтрак, ресторан, трансфер` — трансфер на месте.

## Git

- Коммит: `e61ebbe fix(sales): pass hotel name, contacts, real transfer flag in application form_data`
- Пуш: `23f2c60..e61ebbe main -> main` в `Ulfacar/Ex-Machina`
- Затронут 1 файл, 1 строка изменена.

## Артефакты (не коммитить)

- `backend/.env` — локальные secrets + SQLite URL
- `backend/dev.db` — локальная SQLite БД с 2 тестовыми лидами
- `frontend-platform/.env.local` — `NEXT_PUBLIC_API_URL`
- `sales-home-after-wizard.png` — скриншот home после submit
- `.playwright-mcp/` — снапшоты и консольные логи Playwright

## Что дальше (не входило в задачу сегодня)

- Прод: убедиться, что Railway подтянул `e61ebbe` и пересобрал фронт.
- Миграции 014-018 для админки диалогов (план на 2026-04-19).
- `DELETE /sales/leads/{id}` — тестовый лид id=4 у Алана в проде всё ещё висит.
