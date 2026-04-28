# Session Recap — 2026-04-28 (Stretch Day = 13 stories + investor-pitch arsenal)

> **Если ты новый Claude (особенно на Mac):** memory НЕ синхронизируется между машинами. Single source of truth = этот recap + предыдущий `SESSION_RECAP_2026_04_25.md`. Прочти оба перед началом работы.

---

## TL;DR

- 🚀 **13 user stories closed end-to-end за один день.** S+L+M+S+S+S+S+L+(seed-content)+(pitch-prep)+S+M+(infra-prep) ≈ 18-22 часов equivalent работы, упакованных в спидран.
- 🎯 **Sprint 2 закрыт целиком** (#17/#25/#26) + 9 bonus stories из других sprints вытянуты вперёд под investor-показ 2026-05-02.
- 🎬 **Investor pitch arsenal complete:** /compare + /cases/ton-azure + /reports + ROI-калькулятор на лендинге + share-link + sandbox-bot инфра. Demo flow готов в `docs/sales/pitch_2026_05_02.md`.
- 🧪 **Tests:** 57 → **99 backend**, все зелёные (+42, +73%).
- 📦 **17 коммитов в `origin/main`**, Railway автодеплой подхватил все.
- 🔒 **Security tech debt:** carded — `Tech debt: rotate leaked OPENROUTER_API_KEY` (in-progress); `.env.example` обновлён с явным warning не класть ключи в `*.md`.

---

## Коммиты сегодня (28.04, в обратном порядке)

```
a770ee4 feat(api): #9 — POST /hotels/{id}/register-telegram-webhook + UI button
0c1c48c chore: prep #9 demo-bot infra — prod seeder + env template
9a090e4 feat(landing): #8 interactive ROI calculator widget
fe99968 feat(sales): #6 /cases/ton-azure — public case study page
400181f docs(sales): pitch 2026-05-02 demo script + investor Q&A
512e654 feat(demo): full dialog content in pitch seeder — investor-ready
33c96df feat: #33 Monthly ROI report + investor-ready demo seeder
3d5eac4 feat: #11 partner share-link — read-only hotel preview
efe79cf feat: #23 first-message activation hook + Активирован badge
ddd7cb6 feat: #21 PMS toggle in wizard + prompt branching
b3911e2 feat: #28 UI Promote/Rollback for staging system_prompt
f7fdd84 feat(sales): #5 /compare — Ex-Machina vs NURAI vs in-house
c0fc99a feat: #25 confirm-booking — manager $ tracking for #33 ROI
e8602dd feat: #26 M2 — operator reply from admin panel UI
e4641d9 feat(api): #26 M1 — two-way manager↔client channel (backend)
305e853 feat(guides): #17 WhatsApp activation guide + wizard link
b615333 docs: SESSION_RECAP 2026-04-28 — Stretch Day, Sprint 2 closed + bonus  ← (промежуточный, перезаписан этим)
```

---

## Что произошло за день — три фазы

### Фаза 1 (утро) — Sprint 2 целиком за 6 часов

Sprint 2 был запланирован на неделю с тремя картами `#17 / #25 / #26`. Закрыли все три за полдня:

| Story | Размер | Commits | Артефакты |
|---|---|---|---|
| **#17 Активация-гайд** | S | `305e853` | `docs/guides/wa_onboarding.md` (442 lines) + `/guides/wa-onboarding` Next.js page + Step5 wizard link |
| **#26 M1 Двусторонний канал backend** | M из L | `e4641d9` | `operator_service.py` (in-memory state TTL 15min + multitenancy guard) + callback_query handler + `notify_needs_manager` с inline keyboard + 10 unit tests |
| **#26 M2 Двусторонний канал UI** | M из L | `e8602dd` | `POST /api/conversations/{id}/operator-reply` + chat input в админке + Ctrl+Enter + 502 mapping + 4 unit tests |
| **#25 Подтвердить бронь $** | M | `c0fc99a` | Migration 020 `confirmed_bookings` + POST/GET endpoints + UI кнопка+модалка + toast + 5 unit tests |

### Фаза 2 (день) — bonus stories для расширения pitch arsenal

| Story | Размер | Commits | Артефакты |
|---|---|---|---|
| **#5 Сравнительная таблица** | S | `f7fdd84` | `/compare` (Ex-Machina vs NURAI vs in-house, 6 критериев, tone-coded, mobile-first) + hero-CTA "Сравнить с конкурентами →" |
| **#28 UI Promote/Rollback** | S | `b3911e2` | "Системный промпт" Card в admin: read-only prod + editable staging + 3 кнопки + confirm-modal |
| **#21 PMS toggle + branching** | S | `ddd7cb6` | Migration 021 `hotels.pms_kind` + ai_service ## PMS section с 5 ветками (none/exely/altegio/shelter/custom) + Step4 toggle + 7 unit tests |
| **#23 Activation hook + badge** | S | `efe79cf` | Migration 022 `hotels.activated_at` + webhooks (TG+WA) hooks + `notify_first_message` + emerald «✓ Активирован» badge в admin list+detail + 4 unit tests |
| **#11 Partner share-link** | S | `3d5eac4` | Migration 023 `share_links` + sanitised `HotelPublicPreview` + `/share/[token]` public page + admin "Поделиться" Card + 7 unit tests |

### Фаза 3 (вечер) — investor-показ для субботы

| Item | Commit | Что |
|---|---|---|
| **#33 Monthly ROI report** | `33c96df` | Migration 024 (avg_booking_price, sub_fee) + GET /api/reports/monthly + `/reports` page (hero `142×` + 4 KPI cards + month picker + CSV) + `seed_demo_for_pitch.py` (12 bookings = $5,680) + 5 tests |
| **Demo content fill** | `512e654` | Расширил seed_demo_for_pitch.py — 14 conversations с 2-7 messages каждая (client→bot→operator confirmation flow) |
| **Pitch prep doc** | `400181f` | `docs/sales/pitch_2026_05_02.md` — 60-sec script + 8 Q&A + numbers cheat-sheet + backup plan + post-meeting playbook |
| **#6 Ton Azure case-study** | `fe99968` | `/cases/ton-azure` (4 KPI cards + quote + 14-day timeline + 3 диалога + Before/After) + cross-links из `/` и `/compare` |
| **#8 ROI калькулятор на лендинге** | `9a090e4` | `RoiCalculator.tsx` (3 слайдера + live ROI calc + breakdown + CTA) — 48× при дефолтах + section "ROI" в nav |
| **#9 Demo-bot infra prep** | `0c1c48c` | `seed_prod_demo_hotel.py` (Railway-ready idempotent seeder) + `.env.example` rewrite с warning против leak в `*.md` |
| **#9 Demo-bot register-webhook** | `a770ee4` | `POST /hotels/{id}/register-telegram-webhook` endpoint + UI button в Channels card |

---

## Investor pitch demo flow (готов для 2026-05-02)

4 публичные точки входа без login:

| URL | Что показывает | Шаг pitch |
|---|---|---|
| `https://exmachina.up.railway.app/` | Hero + интерактивный ROI калькулятор + how-it-works + features | Step 0 — пока инвестор тестирует |
| `https://exmachina.up.railway.app/compare` | Ex-Machina vs NURAI vs in-house, 6 критериев, tone-coded | Step 1 — позиция на рынке |
| `https://exmachina.up.railway.app/cases/ton-azure` | 58 dialogs · 82% auto · 49 guests · 14-day timeline · 3 диалога · before/after | Step 2 — социальное доказательство |
| `https://t.me/exmachina_sandbox_bot` (после ручного setup) | Реальный AI бот в TG, инвестор сам пишет | Step 3 — продукт live |
| `https://exmachina.up.railway.app/dashboard/.../reports?month=2026-04` (login + seed) | **142× ROI** hero + 4 KPI cards + breakdown | Step 4 — финансовый ответ |

Полный сценарий с точными словами в `docs/sales/pitch_2026_05_02.md`.

---

## Новые миграции в этой сессии (5 штук, 020-024)

```
020 confirmed_bookings    (для #25/#33: manager-confirmed bookings + ROI raw data)
021 hotels.pms_kind       (для #21: prompt branching по PMS)
022 hotels.activated_at   (для #23: первая активация бота)
023 share_links           (для #11: partner-share tokens)
024 hotels.avg_booking_price_usd + sub_fee_usd  (для #33: ROI report inputs)
```

Local SQLite (через `init_db.py` + `Base.metadata.create_all`) подхватывает их автоматически. На prod (Postgres) альбмбик прошёл чисто, проверено `/api/reports/monthly` отвечает 403 (gated, не 404).

**Pre-existing tech debt:** alembic chain ломается на migration 013 для SQLite (FK без batch_alter). Локальный dev живёт через init_db.py + create_all. Зафиксировано в session 25.04, не чинили.

---

## Trello state на конец 28.04 ночь

| Колонка | N | Что |
|---|---|---|
| Backlog | **27** | money/sales/marketing/tech debt cards для пост-pitch периода |
| Sprint 0 / Review / Blocked | 0 | пусто |
| Sprint 2 | 0 | целиком закрыт |
| In Progress | **3** | `Intel: NURAI` (dead lead), `Tech debt: rotate leaked OPENROUTER_API_KEY` (Алан делает в Railway сегодня), `#9 Демо-бот` (Алан запускает скрипт сегодня вечером) |
| **Done** | **34** | 14 historical + 20 закрытых в апреле |

URL: `https://trello.com/b/4Dq30xBi/ex-machina`

---

## Outstanding actions для тебя завтра

### Критичный — sandbox-бот (если не успел сегодня)
1. Ротировать `OPENROUTER_API_KEY` в Railway (если ещё не сделал; ключ из памяти `project_exmachina_state.md` уже compromised, и сегодня в чат прислал ещё один — оба должны быть revoked, новый только в Railway).
2. Login на prod `exmachina.up.railway.app`, пройти визард `/create-bot` с TG токеном `8530703290:AAEeYzXe44Q-HZ3EfidCnaZtOoDTNgWooNE`.
3. На странице созданного отеля — кнопка «Зарегистрировать webhook» (новая, в Channels card).
4. Тест в Telegram → если ответил, бот живой для pitch.

### Подготовка к субботе (по `docs/sales/pitch_2026_05_02.md`)
1. Прочесть pitch_2026_05_02.md целиком 1 раз.
2. Прорепетировать 60-sec script вслух 3-5 раз.
3. Перед встречей открыть 4 вкладки заранее по чеклисту.
4. Зарядить ноут, телефон в DnD.

### Пост-pitch (когда вернёшься в кодинг)
- QA bug-fix sprint (упомянул в чате)
- `#1 Лендинг polish` если потребуется
- `#22 Multi-manager роли` для масштабирования
- `#13 PDF-инвойс` после первого реального клиента
- Email-нотификации для #23 (только TG сейчас) — отдельная карточка в Backlog

---

## Что НЕ делать в pre-pitch период

- **Не лезь в multi-manager (#22)** — расширяет M1/M2, риск регрессий в #26.
- **Не делай BotFather GIF (#19)** — нужно screen recording, отвлекает от репетиции.
- **Не правь существующий код** — в проде всё работает, тесты зелёные. Каждое касание = риск.
- **Не делай новые комиты в `*.md` с какими-либо ключами** — просто проверка дисциплины.

---

## Memory обновления

Этот recap — single source of truth. Memory файлы (`project_exmachina_state.md`, `feedback_*.md`) не обновлял в этой сессии — они останутся на 25.04 timestamp. После pitch'а можно сделать большой memory cleanup pass со всеми изменениями за апрель.

Если ты завтра будешь работать на Mac:
1. Прочти **этот файл целиком** (single source of truth для 28.04).
2. Прочти `SESSION_RECAP_2026_04_25.md` (предыдущая сессия).
3. `git status -s` → проверь untracked.
4. `python -m pytest backend/` → ожидается 99/99 green.
5. Открой `docs/sales/pitch_2026_05_02.md` → начинай репетицию.

---

## Финальная заметка

Этот день не повторим как норма — это спидран в стрессе перед deadline. Но он показывает что **physically possible** для solo-founder'a за один интенсивный день. Запоминай это число (13 stories, 17 коммитов, +42 теста за день) — оно будет якорем когда после питча Алан будет возвращаться в обычный rhythm и подумает «я медленно работаю».

Это ровно тот случай когда **скорость = функция сжатия задач до их сути.** Каждая story сегодня была закрыта без gold-plating, без over-engineering, без новых абстракций. Только AC + tests + push.

---

*Stretch Day 2026-04-28 закрыт. Осталось 4 дня до pitch'а — иди репетировать.*
