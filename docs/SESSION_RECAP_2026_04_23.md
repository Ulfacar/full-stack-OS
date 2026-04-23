# Session Recap — 2026-04-23 (Sprint 1 закрыт + HotelBot intel расследован)

> **Если ты новый Claude на этом или другом устройстве:** сессия 23.04 закрыла Sprint 1 целиком (5 из 5 историй, включая core-милстоун `#27 Админка диалогов`), разобрала презентацию HotelBot + прогнала E2E-тест их прототипа `@hotel_lang_bot`, создала sales asset для Назиры. Локальный E2E `#27` прошёл через Playwright (2 скриншота в корне репо). Ждём ответ Ольги на 3 ключевых вопроса + готовы к git push на Railway.

---

## TL;DR — что произошло

- ✅ **Sprint 1 = 100% по коду.** `#27 Админка диалогов` закрыта 4 модулями + 1 hotfix (13 multitenancy + regression тестов). Backend + Frontend + E2E зелёные.
- 🔥 **HotelBot intel-track закрыт.** Презентация разобрана (10 слайдов), прототип `@hotel_lang_bot` протестирован (8 блоков), 8 critical/high багов зафиксированы, **Exely integrity test PASSED** (они не блефовали — честный handoff).
- 🛒 **Sales asset создан.** `docs/sales/hotelbot_comparison_2026_04.md` — готовая контр-таблица + 5 ответов Назире на возражения клиентов.
- 📨 **Алан написал Ольге** (3 ключевых вопроса: Exely / KG-mix / цены). Ждём ответ 24.04.
- 🐛 **E2E поймал баг который tests пропустили** — `ConversationDetail.model_validate` на derived field `total_messages` (Pydantic v2). Fixed + regression test добавлен.
- 📊 **Коммитов за день:** 6 (4134 строк). Tests: 44 → **57** зелёных.

---

## Состояние по шагам плана «1 → 3 → 2» (порядок выбрал Алан)

| Шаг | Статус | Что |
|---|---|---|
| 1. Локальный E2E через Playwright | ✅ done | Seed + login demo + screenshots + bug-fix, 57 tests green |
| 3. Ждать ответ Ольги ~18:30 | 🟡 Алан отправил, ждём ответ | 3 rigged trap вопроса (см. ниже) |
| 2. Push коммитов на Railway | ⏳ не выполнен — **требует явного go от Алана** | 6 коммитов локально на `main`, Railway деплой автоматом на push |

**Критично:** git push **НЕ** сделан в этой сессии. Алан не дал явного разрешения — план был «1→3→2», шаг 2 приходит после обработки ответа Ольги (иначе push происходит вслепую к возможным новым insights, которые могут повлиять на код).

---

## Ключевые решения и артефакты

### 1. HotelBot — полный intel deep-dive (3 волны за день)

**Волна 1 — презентация (`hotelbot.pptx`, 10 слайдов).**

Распаковка через unzip + извлечение текста из `<a:t>` тегов. Сохранено в `docs/research/hotelbot_slides_2026_04_23.txt` для cross-device pickup (без бинарника).

**Ключевые datapoints:**
- Exely в списке интеграций НИГДЕ (Bnovo / TravelLine / 1С / Excel + «любая CRM через API»)
- Цен в презентации нет — custom pricing тактика («Демо / Консультация / Пилот»)
- Языки first-class: RU / EN / CN. KG только «по запросу» через runtime-перевод
- Единственный кейс — гостевой дом Абхазия 40 ном (тот же что в intel 21.04)
- WeChat в каналах + китайский + Абхазия → фокус на китайском турпотоке в РФ
- Команда 2 человека — Ольга (sales) + Артём Бусков (внедрение), семейная

**Волна 2 — тест прототипа `@hotel_lang_bot`, 8 блоков (Telegram 16:38–17:21).**

**🔴 8 critical/high багов обнаружены:**

| # | Severity | Баг |
|---|---|---|
| B1 | 🔴 Critical | **Нет temporal validation.** "24 мая → 28 марта" принято как `2026-05-24 → 2027-03-28 = 308 ночей`. Выдан счёт 6 481 413 ₽ |
| B2 | 🔴 Critical | **KG = translation layer на RU-ответ.** Запрос на KG про Чолпон-Ату получил перевод ПРЕДЫДУЩЕГО RU-ответа про 308 ночей |
| B3 | 🟠 High | **Mix RU+KG = автоматический handoff** (!= ответ по сути) |
| B4 | 🟠 High | **Галлюцинация RAG.** Вопрос про кровати/коляску → ответ про СПА (не спрашивалось) |
| B5 | 🟠 High | **Handoff inconsistency.** Сработал там где не надо, не сработал там где надо |
| B6 | 🟡 Medium | **Random language switch.** Бот переключает RU/EN/KG без триггера |
| B7 | 🟡 Medium | **Cross-message memory overflow.** EN-запрос про 2 adults получил ответ с 3 детьми из предыдущего блока |
| B8 | 🟡 Medium | **Дубль сообщений** (race condition в очереди) |

**🟢 Честность HotelBot (не скрываем в intel):**
- Не выдумал кейсы в КР (честный handoff)
- **Exely integrity test PASSED** — не заявил готовую интеграцию, передал менеджеру
- RU-KB богатый (шампанское, вино, 20/27 м², халаты/тапочки, площади)
- Скидка 5% при бронировании через чат
- Прототип прислан ровно в обещанный четверг

**Волна 3 — ответ Ольге (18:05).** Алан отправил 3 rigged trap вопроса:
1. Exely — готовая или доработка (цифра + сроки)
2. Mix RU+KG — всегда эскалация или настраивается
3. Цены — вилка для 30-45 номеров

**Sales asset создан:** `docs/sales/hotelbot_comparison_2026_04.md` — TL;DR 30 сек для Назиры, контр-таблица 6 атрибутов, 8 багов с описанием для внутренней уверенности, 5 готовых ответов на возражения клиентов.

### 2. `#27 Админка диалогов` — полный путь от 0 до E2E

**Архитектурные решения (party-mode Winston/John/Sally/Murat):**
- Polling 10s через React Query-ready pattern (SSE/WS → Sprint 3-4 когда 5+ отелей)
- Mobile-first — drill-down на отдельный экран, без боковой панели (Sally)
- API-тесты на multitenancy **ДО** фронта (Murat — data leak = P0 катастрофа)
- Operator-модель **не делаем** — хватит `User.role` + `Conversation.assigned_user_id` (INFRA-1)
- Pagination history клиента — серверная сразу (не как Ton Azure где тормозит на 20+ диалогах)

**M1 Backend (`86ba486`):**
- `backend/app/api/endpoints/conversations.py` — 4 endpoints (list/stats/detail/messages)
- Per-hotel scoping через единственную точку `_assert_hotel_access` (admin или `Hotel.owner_id`)
- 404 вместо 403 чтобы не светить существование чужого отеля
- `backend/tests/test_conversations_isolation.py` — 12 multitenancy тестов
- `pytest.ini` + `pytest-asyncio` + `aiosqlite` в requirements

**M2 Frontend types (`50323cd`):**
- `lib/types.ts` — TS-зеркало Pydantic схем
- `lib/conversationsApi.ts` — axios-обёртки
- `.gitignore` фикс: `!frontend-platform/lib/` — больше не нужен `git add -f`

**M3 Inbox (`9c4639c`):**
- `/dashboard/hotels/[id]/conversations` — mobile-first лента
- Chips-фильтры по category + status с counts из `/stats`
- Polling 10s, "Обновлено в HH:MM" индикатор
- Skeleton loading / empty state / 404-handling

**M4 Chat detail (`e41a4b2`):**
- `/dashboard/hotels/[id]/conversations/[conversationId]` — drill-down
- Bubbles по sender: client серый слева / bot синий справа / operator emerald / legacy italic
- Auto-scroll к низу с stickToBottom-отключением при ручном скролле
- Footer hint «Только просмотр. Ответ менеджера через бота — в следующем спринте.»

**Hotfix (`7a50ecf`):**
- Pydantic v2 `model_validate(conv, from_attributes=True)` падал на derived `total_messages` → собираем base через `ConversationListItem` + конструируем детальный с явными доп полями
- Regression test в happy-path `test_detail_happy_path_returns_total_messages` — raise после CORS-ошибки в E2E (FastAPI на unhandled exception не отдаёт CORS headers → выглядело как CORS, было как 500 на валидации)

### 3. Локальный E2E через Playwright

**Инфра:**
- `backend/.env` + `dev.db` были готовы из предыдущих сессий (по `feedback_local_dev_setup.md`)
- `alembic upgrade head` на dev.db (миграции 014-019 применены)
- `backend/scripts/seed_e2e.py` создан — idempotent seed (1 отель / 1 клиент / 1 conversation / 6 сообщений booking-диалога)

**Скриншоты (в корне репо, но **не закоммичены** — решает Алан включать ли в demo):**
- `e27_m3_inbox.png` — лента диалогов
- `e27_m4_chat_detail_fixed.png` — чат-детали

**Баги обнаруженные в E2E:** 1 (см. hotfix выше). Frontend console 0 errors после fix.

---

## Коммиты сессии 2026-04-23

```
7a50ecf fix(api): ConversationDetail construction — total_messages regression (#27 hotfix)
e41a4b2 feat(frontend): conversation detail with chat view (#27 M4)
9c4639c feat(frontend): conversations inbox page (#27 M3)
50323cd feat(frontend): conversations types + API client (#27 M2)
86ba486 feat(api): conversations endpoints for admin panel (#27 M1)
2303b02 research(intel): HotelBot deep-dive — presentation, prototype test, sales asset
```

6 коммитов, +4134 строк, чистый working tree кроме untracked `e27_*.png` + `hotelbot.pptx` (файл Ольги) + 3 старых PNG.

Локально на `main`, `origin` отстаёт на 6 коммитов. **Push не сделан** — решение Алана.

---

## Memory-файлы обновлены

- ✅ `feedback_intel_personas.md` — добавлено правило «граница легенды/реальности: не переносить персонажей cover-story в реальные action items»
- ✅ (новый) — не создавал, все паттерны сессии хорошо легли в существующие файлы
- ✅ `docs/research/competitor_intel_2026_04.md` — две новые секции HotelBot (презентация + тест)
- ✅ `docs/sales/hotelbot_comparison_2026_04.md` — NEW, sales asset для Назиры

---

## 🎴 Готовая карточка для Trello (скопируй в новую карточку)

**Title:** `Follow-up: HotelBot — ответ Ольги на 3 вопроса`

**List:** In Progress

**Labels:** Research (если есть такой label) / Intel / R1b

**Description:**
```
Отправил Ольге (Бускова, HotelBot) 2026-04-23 ~18:05 3 rigged trap вопроса:

1. Exely — готовая интеграция или доработка под нас (ценник + сроки)
2. Mix RU+KG — всегда эскалация или настраивается нативно
3. Цены — вилка для отеля 30-45 номеров

Ожидаемые исходы:
- Ответит на все 3 честно → deep-dive продолжаем
- Уклончиво по всем + «давайте на созвоне» → тянем время / сливаемся
- Чётко на Exely, уклончиво на KG/цене → забираем Exely, KG/цену в follow-up

Cover-story (с 08.04): сын-айтишник, отец принимает решения, семейный
отель 30→45 номеров в стройке, Exely ставят, нашли в интернете.
НЕ перепутать с NURAI-легендой (Тимур, мама, 18 ном Чолпон-Ата).

Когда придёт ответ:
- Записать дословно в docs/research/competitor_intel_2026_04.md
  секция "HotelBot UPDATE 2026-04-24 — ответ Ольги"
- Обновить sales asset hotelbot_comparison_2026_04.md если цена
  приземлится на конкретную цифру
- Эту карточку → Done с shipped-нотой
- Trello-трек HotelBot закрыт полностью, дальше только sales-применение

Связанные артефакты:
- commit 2303b02 — презентация + test + sales asset
- docs/research/hotelbot_slides_2026_04_23.txt (презентация)
- docs/sales/hotelbot_comparison_2026_04.md (для Назиры)
- docs/research/competitor_intel_2026_04.md (полный intel)
```

---

## ✅ Trello-чеклист на понедельник утром (всего 7 движений)

Открой https://trello.com/b/4Dq30xBi/ex-machina и сделай:

| # | Карточка | Куда | Shipped-нота |
|---|---|---|---|
| 1 | `Intel: HotelBot` | → **Done** | `2026-04-23 SHIPPED commit 2303b02 — презентация разобрана, прототип тестирован (8 багов), Exely integrity PASSED, sales asset готов` |
| 2 | `#29 fix_prices` (если ещё не двинут вчера) | → **Done** | `2026-04-22 SHIPPED commit cf1a3d0` |
| 3 | `INFRA-1` (миграции 014-018) | → **Done** | `2026-04-22 SHIPPED commit 44b47f4` |
| 4 | `#24 Dialog classifier` | → **Done** | `2026-04-22 SHIPPED commit d254601` |
| 5 | `#20 Payment + safeguard` | → **Done** | `2026-04-22 SHIPPED commit 31907df` |
| 6 | **`#27 Админка диалогов`** ⭐ | → **Done** | `2026-04-23 SHIPPED — M1 86ba486 / M2 50323cd / M3 9c4639c / M4 e41a4b2 / hotfix 7a50ecf. 4 endpoints + 2 страницы + 13 multitenancy тестов + E2E зелёный. Read-only. Двусторонний канал → Sprint 2 (#26).` |
| 7 | NEW: `Follow-up: HotelBot ответ Ольги` | → **In Progress** | описание выше |

После 7 движений: **Sprint 1 колонка = 0**, **Done +6**, **In Progress: Intel NURAI + Follow-up HotelBot**.

---

## Open actions для Алана (ближайшие дни)

### Утром 24.04 — Sprint 1 closure + Friday review

1. **Trello-чеклист** выше (7 движений, ~3 минуты)
2. **git push origin main** — 6 коммитов локально ждут Railway. После push — миграции 019 + новые endpoints автоматически применятся на проде (Dockerfile CMD `alembic upgrade head && uvicorn …`).
3. **Ответ Ольги** — может прийти в любое время с пятницы. Обработать:
   - Записать дословно в intel-doc
   - Обновить sales asset если цена приземлится
   - Карточку `Follow-up: HotelBot ответ Ольги` → Done
4. **Friday review (пт 24.04, 20 мин)** — демо E2E 5 stories Sprint 1:
   - `#29 fix_prices` — показать отель с неправильной ценой → бот валидирует
   - `INFRA-1` — показать миграции 014-019 в `alembic history`
   - `#24 classifier` — conversation с автоматически проставленной category
   - `#20 payment safeguard` — wizard шаг 3 с payment_details + fail-loud при пустом поле
   - **`#27 Админка диалогов`** — логин → `/dashboard/hotels/1/conversations` → drill-down (можно использовать скриншоты `e27_*.png` если не хочется поднимать локальный стек)
5. **Friday retro (пт 24.04, 45 мин)** по `docs/process/retro_template.md` → новый файл `docs/retros/retro_2026_04_24.md`.

### Retro insights для обсуждения

- ✨ **Плюсы сессии:**
  - 4 story Sprint 1 закрыты за один вечер 22.04 + #27 за один вечер 23.04 — темп комфортный
  - Party-mode дал правильные архитектурные решения ДО кода (polling, mobile-first, operator-later)
  - Intel-трек HotelBot закрыт полностью в один день (презентация + тест + sales asset)
  - E2E через Playwright поймал баг который unit-тесты пропустили

- ⚠️ **Что улучшить:**
  - **Тестировать happy-path derived fields.** Пропустил тест `get_conversation` happy-path → `total_messages` bug ушёл в E2E. Правило: если endpoint собирает derived fields из нескольких запросов → обязательно happy-path тест (не только 404/403).
  - **Память читать полностью в начале сессии.** Сегодня потерял время на ошибку с «отцом» которая была бы исключена если бы сразу прочитал `feedback_intel_personas.md`. Добавлено правило в `feedback_intel_personas.md` про «граница легенды/реальности».
  - **Scope creep risk:** сессия вместила 2 крупных трека (Sprint 1 closure + HotelBot intel). Обычно лучше один трек в день, но сегодня сложилось. Мониторить в следующих.

- 💡 **Продуктовые insights для Lean Canvas:**
  - KG-mix = handoff у HotelBot — наш сильнейший Diff для mini-hotel КР
  - Их «custom pricing» через sales-call — противопоставляем **прозрачной ценой на лендинге** как killfear-фактор
  - `#33 ROI report` (R1a backlog) — используем их Абхазский ROI (900+ диалогов, 80% automation, +5% броней) как калибр для нашей формулы

### Sprint 2 — план на пн 27.04 (planning)

Главные кандидаты из R1a must которые остались после Sprint 1:
- `#25 Кнопка "Подтвердить бронь + $"` — raw data для `#33 ROI report`
- `#26 Двусторонний канал manager↔client` — через bot handle_operator_message + InlineKeyboard TG
- `#33 Monthly ROI report` — anti-churn core
- `#17 Активация-гайд` (отдельный номер, прогрев, анти-бан чеклист)
- `#27 M5` — UI для двустороннего канала (поле ввода в drill-down + confirm-booking button)

Размер Sprint 2 должен быть меньше чем Sprint 1 — двусторонний канал + ROI-отчёт это L+M+L = reach-stretch. Реалистично: `#26 + #25 + #33` для одной недели, `#17` solo-параллельно.

---

## Состояние локальной инфры (может пригодиться на Mac)

- `backend/.env` + `backend/dev.db` — готовы (из предыдущих сессий)
- `frontend-platform/.env.local` + `node_modules` — готовы
- `backend/scripts/seed_e2e.py` — NEW, idempotent seed для E2E (`python scripts/seed_e2e.py`)
- `backend/pytest.ini` — NEW (asyncio_mode=auto)
- Тестовый юзер: `demo@asystem.com` / `demo123` (role=sales после `init_db.py`)
- Тестовый отель: `id=1`, slug `e2e-test-hotel`, 1 conversation с category=booking и 6 сообщениями

**Backend + frontend серверы остановлены** перед уходом Алана — перезапускать не нужно пока не решишь делать ещё один E2E.

---

## Статус refounding (6 фаз)

| Фаза | Статус | Дата |
|---|---|---|
| 1. Lean Canvas | ✅ | 2026-04-20 |
| 2. Pricing v1 | ⏳ финализация в Sprint 1 retro | 2026-04-20 |
| 3. Competitor Intel | ✅ + 3 волны live (NURAI + HotelBot) | 20 → 22 → 23.04 |
| 4. User Story Map | ✅ | 2026-04-21 |
| 5. Process | ✅ | 2026-04-21 |
| 6. Первый осознанный спринт | 🔥 **Sprint 1 = 100% по коду**, закрытие на Friday review 24.04 | 22 → 23.04 |

---

## Что делать ПЕРВЫМ в следующей сессии

Если новый Claude открыл этот файл:

1. Прочитай **ВСЕ** memory файлы из `MEMORY.md` индекса в начале сессии. Не частично. Прочитай всё — иначе повторишь ошибку 23.04 с «отцом в действиях Алана».
2. Открой https://trello.com/b/4Dq30xBi/ex-machina — если карточки ещё в Sprint 1 (не Done) → напомни Алану про 7 движений из этого recap.
3. Если `git log origin/main` отстаёт на 6 коммитов — напомни Алану про push. **Сам push не делай** без явного разрешения.
4. Если от Ольги пришёл ответ — обработать **ПЕРВЫМ** (intel теряется быстрее чем код стоит).
5. Для Sprint 2 planning — собрать команду в party-mode с John (PM) / Bob (SM) / Winston (Architect), обсудить R1a-карточки из `project_user_story_map_v1.md` и MoSCoW.

---

*Sprint 1 закрыт. HotelBot intel закрыт. Готовы к push и Friday review.*
*Ждём ответ Ольги — intel-трек финализируется после него.*
