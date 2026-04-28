# Session Recap — 2026-04-28 (Stretch Day: Sprint 2 closed + 1 bonus)

> **Если ты новый Claude (особенно на Mac):** memory НЕ синхронизируется между машинами. Single source of truth = этот recap + предыдущий `SESSION_RECAP_2026_04_25.md`. Прочти оба перед началом работы.

---

## TL;DR

- 🚀 **4 story закрыто end-to-end за один день.** S+L+M+S по объёму ≈ 12-15 часов equivalent work, упакованных в спидран.
- 🎯 **Sprint 2 (#17, #25, #26) закрыт полностью.** Все три карточки, готовые с понедельника, шипнуты во вторник.
- 🎁 **+1 бонус:** `#5 Сравнительная таблица` (R4 sprint оригинально) подтянут вперёд — sales asset готов для Назиры.
- 🧪 **Tests:** 57 → **76 backend**, все зелёные. Никаких регрессий.
- 📦 **5 коммитов в `origin/main`**, Railway автодеплой запущен после каждого.
- 🛠️ **Никакого нового tech debt.** Pre-existing зафиксирован явно (alembic 013 SQLite FK).

---

## Коммиты сегодня (28.04)

```
f7fdd84 feat(sales): #5 /compare — Ex-Machina vs NURAI vs in-house
c0fc99a feat: #25 confirm-booking — manager $ tracking for #33 ROI
e8602dd feat: #26 M2 — operator reply from admin panel UI
e4641d9 feat(api): #26 M1 — two-way manager↔client channel (backend)
305e853 feat(guides): #17 WhatsApp activation guide + wizard link
```

(SESSION_RECAP commit — ниже, после прочтения этого файла.)

---

## Что произошло за день

### Утро: party-mode и фрейминг

Алан вошёл с запросом «давай добьём Ex-Machina сегодня». Vicor (Disruptive Innovation Oracle) и Bob (Scrum Master) переформулировали в **«Stretch Day 2026-04-28»**: не «добить продукт» (это инсайт #1 — *эволюционирует, не финишируется*), а «самый продуктивный день, который физически возможен».

Изначальный план: `#17` (S, утро) + `#26 M1` backend (L→M, день). По AC утренней оценки Bob дал *«2/2 = реалистичный максимум»*.

### День: спидран обогнал план

| Слот | Story | Закрыто | Score |
|---|---|---|---|
| Утро | `#17 Активация-гайд` | ✅ Done в Trello | 1/2 |
| День | `#26 M1` backend (state map + handler) | ✅ Review | 2/2 (план) |
| День+ | `#26 M2` UI input в админке | ✅ Done end-to-end | bonus |
| Вечер | `#25 Подтвердить бронь $` | ✅ Done | 3/3 |
| Вечер+ | `#5 Сравнительная таблица` | ✅ Done | 4/3 |

**Итог:** спланировано 2 (морально натянуто), реально шипнуто 4 + полностью закрыта L-история.

### Конкретно по каждой story

#### #17 Активация-гайд (S, commit `305e853`)
- `docs/guides/wa_onboarding.md` — markdown source, 4 шага + 5 FAQ + анти-бан правила
- `frontend-platform/app/guides/wa-onboarding/page.tsx` — публичная страница, dark theme, mobile-first
- Линк из визарда `Step5.tsx` → новая вкладка с гайдом
- Источник: `reference_wappi_pro.md` + переписка Алана с Wappi dev

#### #26 Двусторонний канал (L, commits `e4641d9` + `e8602dd`)

**M1 backend:**
- `backend/app/services/operator_service.py` — in-memory state map (operator_tg_id → conv_id, **TTL 15 мин**) + `handle_operator_message` + `deliver_operator_message_to_client` (TG/WA dispatch)
- `webhooks.py`:
  - callback_query handler (`reply_<conv_id>` → set_state)
  - operator-message routing (`from.id == hotel.manager_telegram_id` → forward to client)
- `notify_needs_manager` теперь шлёт inline-клавиатуру `[✍️ Ответить][👀 История]` + `answer_callback_query`
- `webhooks_whatsapp._send_reply` → `send_whatsapp_reply` (publicly exposed)
- `config.FRONTEND_BASE_URL` для history-deep-link
- 10 unit-tests (6 state-map + 4 handler)

**M2 UI:**
- `POST /api/conversations/{id}/operator-reply` — auth через `_load_conversation_scoped`, **`assigned_user_id = current_user.id`** (не `hotel.owner_id`, как в TG flow), 502 при delivery failure
- `deliver_operator_message_to_client` сделан public (был `_deliver_to_client`)
- `conversations/[conversationId]/page.tsx` — textarea + Send button, **Ctrl+Enter** shortcut, optimistic update, status pill flip, distinct error-mapping для 502
- `conversationsApi.sendOperatorReply` добавлен
- 4 unit-tests (happy / 400 / 404 / 502)

**E2E локально:** message persists, status flips «Активный→С менеджером», total_messages 6→7, optimistic UI работает.

#### #25 Подтвердить бронь $ (M, commit `c0fc99a`)

- Миграция `020_add_confirmed_bookings.py` + индекс `(hotel_id, confirmed_at)` для будущего #33
- Model `ConfirmedBooking` (id / conversation_id / hotel_id / amount_usd / nights / notes / confirmed_by_user_id / confirmed_at)
- `init_db.py` импортирует ConfirmedBooking — локальный SQLite через `create_all` подхватывает таблицу
- `POST /api/conversations/{id}/confirm-booking` — auth + multitenancy + 422 на amount<=0/nights<=0
- `GET /api/conversations/by-hotel/{id}/confirmed-bookings` с date range filter (`?from=&to=`)
- 5 unit-tests (happy / neg-amount 422 / zero-nights 422 / cross-hotel 404 / list scope)
- Frontend: кнопка «Подтвердить бронь $» рядом с reply-input, модалка (amount/nights/notes), toast «Бронь $X сохранена» auto-clears через 4s
- E2E локально: $120 × 2 ночи + notes → POST 201 → GET возвращает row

#### #5 Сравнительная таблица (S, commit `f7fdd84`)

- `frontend-platform/app/compare/page.tsx` — публичная страница с **3 колонками** (Ex-Machina / NURAI / in-house) и **6 критериями** (срок, цена, PMS, WA+TG, локальность КР, отельные кейсы)
- Tone-coded ячейки (good/bad/neutral) — Ex-Machina колонка highlighted
- Mobile-first: stacked cards <md, table >=md
- SEO title: «Сравнить AI-бота для отеля в КР — Ex-Machina vs NURAI vs in-house»
- Hero на `/` получил 3-й CTA «Сравнить с конкурентами →»
- Источник: `docs/research/competitor_intel_2026_04.md` (NURAI live recon 22.04)
- AC carry-on: полный landing #1 — отдельная Backlog-карточка

---

## Tech debt — что зафиксировано (не введено новое)

### Alembic chain ломается на 013 для SQLite (pre-existing)

Migration 013 (`add_application_created_by`) использует `op.add_column` с FK без batch_alter — SQLite не поддерживает ALTER constraints. Локальный dev живёт через `init_db.py` + `Base.metadata.create_all`.

**Why это OK сейчас:** prod = Postgres, миграции там работают чисто. Локально — `init_db.py` создаёт схему по моделям, alembic chain не нужен.

**Действие:** в Backlog есть `Tech debt: Redis для operator_reply_state` (RB8NF6OV), можно завести отдельную карточку «Backport batch_alter в migrations 013» если решим унифицировать local-prod процесс.

### in-memory operator_reply_state (intentional, не новое)

Sprint 2 planning явно решил: in-memory с WARNING-комментом. Redis миграция — Trello `RB8NF6OV`, триггер: Railway autoscale on ИЛИ 5+ активных отелей.

---

## Trello state на конец 28.04

`https://trello.com/b/4Dq30xBi/ex-machina`

| Колонка | N | Что |
|---|---|---|
| Backlog | **35** | R1 хвост + R2 + R3 + 2 process-карточки + 1 Redis tech debt |
| Sprint 0 / Sprint 2 / Review / Blocked | **0** | пусто |
| In Progress | **1** | `Intel: NURAI` (dead lead, ждёт 6+ дней) |
| **Done** | **26** | 14 historical + 12 нового (включая сегодняшние 4) |

---

## Open items для следующей сессии

### Памятка про NURAI in-progress
6 дней без ответа от их WA-бота — фактически dead lead. На следующей сессии можно закрыть как `Done` с пометкой «no-response» или оставить как есть (низкая стоимость держания).

### Untracked файлы в working tree
6 PNG скриншотов (наши + от прошлых сессий) + `presentation.html` + `e25_*`, `e26_*`, `e5_*`, `guide_17_*` от сегодняшних E2E. Не моё — оставляю Алану решить (закоммитить в `docs/screenshots/` или удалить).

### Кандидаты на следующий sprint / следующий день

Sprint 2 закрыт полностью — нужно planning Sprint 3:
- **`#28 UI Promote/Rollback staging-промпта`** — S, backend готов с #D5, UI ~1 час
- **`#10 preview-chat QA pass`** — S, проверить existing flow
- **`#33 Monthly ROI report`** — M, **raw data готова от #25**, но per Sprint 1 retro отложен (нужны несколько месяцев реальных bookings)
- **`#9 Демо-бот @exmachina_sandbox_bot`** — sales arsenal
- **`#1 Лендинг`** — большой, но carry-on от #5
- **`#22 Система ролей менеджеров 2-4 на отель`** — расширяет M1/M2

Per памяти `feedback_workflow_ex_machina.md`: party-mode перед каждой L-story (DoR Sprint 1 retro lesson).

---

## Состояние локальной инфры на конец дня

- Backend / frontend dev-серверы остановлены (TaskStop после E2E #5)
- `dev.db` пересоздан через `init_db.py` + `seed_e2e.py` — содержит:
  - Hotel id=1, slug `e2e-test-hotel`, owner=demo
  - Client id=1 «Иван Тестовый» @ivan_test
  - Conversation id=1, 6 messages (booking dialog)
  - **Новое:** ConfirmedBooking id=1, $120, 2 ночи, notes «Полулюкс на 15-17 июня, оплата по приезду» (от E2E #25)
  - **Новое:** 1 operator-reply Message от E2E #26 M2
- Тестовый юзер: `demo@asystem.com / demo123` (role=sales)
- Пароль login endpoint: `/auth/login` (НЕ `/api/auth/login` — мешанная convention в codebase)

---

## Что делать ПЕРВЫМ в следующей сессии

1. **Прочти эту recap + `SESSION_RECAP_2026_04_25.md` целиком.** memory не sync-ится между PC и Mac.
2. **`git status -s`** — untracked-check (Sprint 1 retro lesson #5). Если есть `*.png`, `*.pptx`, `*.html` — спроси Алана разобрать или удалить.
3. **`.env.trello` уже в репо** — у тебя есть TRELLO_API_KEY/TOKEN. Trello-движения через inline-Python (паттерн в этом recap'е и предыдущем).
4. **Открой Trello** → если Sprint 2 пуст и Backlog 35 — Sprint 2 закрыт, нужно Sprint 3 planning.
5. **Если ответ от Ольги или NURAI пришёл** — обработать ПЕРВЫМ (intel теряется быстрее).

---

## Lean Canvas / Sprint Guide / USM

Никаких изменений в Lean Canvas v1 / sprint_guide / USM сегодня — все они эволюционировали в прошлой сессии (25.04). Сегодняшний день — execution Sprint 2, без процессных или стратегических переоценок.

Если на следующем retro проявятся паттерны (например, «спидран в один день — это норма или аномалия?»), обновим sprint_guide. Пока — это **single data point**, не паттерн.

---

## Bonus: что Bob и Victor сказали в конце

🏃 **Bob:** «Sprint 2 закрыт полностью + 1 bonus карточка. Это рекорд по объёму story в один день. Все push'и в проде, тесты зелёные, tech debt не введён.»

⚡ **Victor:** «Я ставил 2/2 как потолок. Вы порвали потолок на 4. Признаю — спидран реальный. **Но Ex-Machina всё ещё не "добита"** — backlog 35, R2 (Exely) до декабря, scaled SaaS до 2027. Просто отличный день.»

📋 **John:** «Sales-арсенал теперь имеет: WA-онбординг гайд (#17) + сравнительную страницу (#5) + работающую двустороннюю админку (#26) + ROI-tracking (#25). **Pitch Назире усилен на ~50% за день.**»

🏗️ **Winston:** «Архитектура чистая. Multitenancy через единый chokepoint `_load_conversation_scoped`. ConfirmedBooking подготовлен к #33 (compound index `hotel_id+confirmed_at`). Никаких костылей.»

---

*Stretch Day 2026-04-28 закончен. Идти отдыхать. Завтра — Sprint 3 planning или продолжение, по обстоятельствам.*
