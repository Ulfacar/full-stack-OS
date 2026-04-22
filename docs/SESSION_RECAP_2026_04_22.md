# Session Recap — 2026-04-22 (Intel + Sprint 1: 3/4 historий закрыто)

> **Если ты новый Claude, который это читает:** плотный вечер среды. За сессию сделан live-intel на двух конкурентов, закрыты 4 истории Sprint 0 + Sprint 1 (3 из 4), проект получил первую `tests/`-инфраструктуру. Осталась одна карточка — `#27 Админка диалогов` (L, core-милстоун Sprint 1).

---

## TL;DR — что произошло

- 🔥 **Intel live на двух фронтах:** NURAI (сайт nurai.one + WA-бот переписка, 3 открытых вопроса) и HotelBot (попрощались до четверга 23.04, ждём прототип)
- ✅ **Sprint 0 закрыт** (`#29 fix_prices` — generic validator по `hotel.rooms`)
- ✅ **Sprint 1 на 75%:** INFRA-1 (миграции 014-018), `#24 категоризация`, `#20 реквизиты + fail-loud safeguard`
- 🎯 **Осталось в Sprint 1:** `#27 Админка диалогов` — core-милстоун, берём со свежей головой
- 📊 **Тесты:** 0 → 44 unit-tests, первая `backend/tests/` инфраструктура
- 📐 **Миграции:** 13 → 19
- 🧭 **Party-mode 3 Q-карточки** решены: Q1 → Intel:NURAI в In Progress, Q2 → INFRA-1 отдельной карточкой, Q3 → Sprint 1 = вариант C «гибрид»

---

## Ключевые решения и артефакты

### 1. Live intel NURAI — сайт + первая переписка (22.04)

**URL найден:** `https://nurai.one/` (раньше в памяти было «сайт не в публичном индексе»)

**Прайсинг публичный (с сайта):**
| Тариф | Цена | Чатов |
|---|---|---|
| Start | $79/мес | 500 |
| Optima ⭐ | $129/мес | 1200 |
| Pro | $349/мес | 4000 + amoCRM/Б24 |
| Enterprise | по запросу | dedicated |

**Переписка 22.04 (легенда: Тимур, сын, мама гостевой дом 18 номеров Чолпон-Ата), WA +996 555 653 542:**
- Бот NurAI ответил `«от 2700 сом (~$31) за 1000 клиентов»` ≠ сайт-прайс. Расхождение 2.5× цена/metric = критичный datapoint.
- Алан задал 3 острых вопроса (тарифная механика / отельные кейсы / Exely интеграция). **Ждём ответ**.

**Поведенческие datapoints:**
- 🔴 Демо-бот `@pharmaAI94bot` (TG) **не отвечает 22.04 в рабочий день** — публичный пруф низкого priority на support собственной демо-витрины
- ❌ Отели отсутствуют в заявленных отраслях (Интернет-провайдеры/Банки/...) и ни одного отельного кейса на сайте — гипотеза: продают «как будто hotel-ready», реального опыта нет
- ❌ Exely не в интеграциях (amoCRM / Битрикс24 / Altegio / Chat2Desk) → наш differentiator

**Файл:** `docs/research/competitor_intel_2026_04.md` — большая новая секция «NURAI — UPDATE 2026-04-22»

### 2. HotelBot update — Ольга отвечает в чт 23.04

**Реальная легенда (фиксируем):** Сын-айтишник, **отец** принимает решения, **30→45 номеров в стройке**, **Exely ставят**, нашли в интернете. Ни в коем случае не перепутать с NURAI-легендой «мама 18 ном Чолпон-Ата».

**Sales-вывод частично пересмотрен:**
- Для отелей 50+ / enterprise РФ: HotelBot это их сегмент (конкурирует с AI Studio, $1200-6000)
- Для 30-50 ном КР в стройке: цена болезненная, но не абсурдная ($2670 ≈ 1.5-2 мес выручки одного крыла) — **пересечение с верхом нашей ЦА существует**
- Для 15-30 ном (core ICP): HotelBot вне досягаемости

**Integrity test готов на чт 23.04:** Алан в переписке проболтался «Exely нам ставят». В intel HotelBot Exely НЕТ. Если Ольга в чт скажет «Exely без проблем» = врёт = поведенческий datapoint. Если «нужна доработка» = честна.

**Файл:** тот же `competitor_intel_2026_04.md` + Trello-карточка с 4 сценариями реакции на прототип.

### 3. Mini-hotel vertical = monopolist by design (новый insight)

После сравнения HotelBot (enterprise РФ) + NURAI (universal CRM, без отелей) + AI Studio / HiJiffy / Asksuite (50+ номеров, глобал):

| Сегмент | Игроки | Ex-Machina |
|---|---|---|
| Enterprise отели РФ/глобал (50+, IT-отдел) | HotelBot, AI Studio, Asksuite, HiJiffy | ❌ не идём |
| Universal CRM-bot (любой бизнес) | NURAI | ❌ не идём |
| **Mini-hotel vertical (15-40 ном КР)** | **НИКТО** | ✅ **только мы** |

Этот тезис добавлен в раздел Updated Unfair Advantage и ждёт интеграции в Lean Canvas Block 9.

### 4. Party-mode: 3 Q-карточки → 3 решения

Утром Mary, Winston и John подняли 3 открытых вопроса в party-mode. Все закрыты за день:

- **Q1 (Mary): Intel:NURAI карточка — закрыть?** → Перенесена в **In Progress** (Алан реально делает переписку), Q-карточка архивирована.
- **Q2 (Winston): Миграции 014-018 — отдельная карточка?** → Да, создан `#INFRA-1`. Q-карточка архивирована.
- **Q3 (John): Sprint 1 — инфра-долги или monetization milestone?** → Выбран вариант **C (гибрид)**: `INFRA-1 + #27 scaffolding + #20 + #24`. `#17` и `#10` возвращены в Backlog. Q-карточка архивирована.

### 5. Sprint 1 — 3 истории закрыты

#### `#29 fix_prices` (Sprint 0, commit `cf1a3d0`)
- Generic `validate_prices_in_response(text, hotel)` — читает `Hotel.rooms[].price` + опциональные `aliases`
- **Ключевое решение**: не порт 1:1 hardcoded `_CORRECT_PRICES` Ton Azure, потому что Ton Azure живёт в отдельном проекте и не затронут
- 15 unit-tests. `ensure_room_variants` + seasonal awareness отложены в Backlog: `#PRICE-SEASONAL`, `#PRICE-VARIANTS`

#### `INFRA-1` миграции 014-018 (commit `44b47f4`)
- 014 `Conversation.category` + index
- 015 `Message.sender` (business-level: client/bot/operator, independent of `role`) + index
- 016 composite indices (`conversations.hotel_id, updated_at` + `messages.conversation_id, created_at`)
- 017 `Conversation.last_message_at` / `last_message_preview` / `unread_count`
- 018 `Conversation.assigned_user_id` FK users.id (через batch_alter_table для SQLite-кросс-совместимости)
- up/down/up цикл verified на dev.db

#### `#24` dialog classifier (commit `d254601`)
- `dialog_classifier.py` — gpt-4o-mini классификация в 4 категории (booking/general/rooms/service) из Ton Azure admin
- Хук в `followup_service._followup_worker` после 2-го followup: если `conv.category is None` → classify → save
- 18 unit-tests (parse edge-cases + fake AI service integration)
- AC #4 «фильтр `/conversations?category=booking`» отложен в `#27` (админка)

#### `#20` payment details + fail-loud safeguard (commit `31907df`)
- Миграция 019 `hotels.payment_details` JSON nullable
- `HotelPaymentDetails` schema + `HotelCreate/Update` support + save в `create_hotel`
- `generate_system_prompt` добавляет секцию `## РЕКВИЗИТЫ ОПЛАТЫ` если заполнено
- `response_processor.check_payment_placeholder` — detect `[РЕКВИЗИТЫ]/[реквизиты]/[payment_details]` placeholder-ы. 11 unit tests
- `notify_payment_details_missing` в NotificationService — fail-loud алерт
- Safeguard встроен в `webhooks.py` (TG) и `webhooks_whatsapp.py` (WA) — skip send + notify owner
- Frontend: wizard step 3 расширен 4 полями (bankDetails / phoneForPayment / iban / paymentNotes) + warning copy

### 6. Первая `backend/tests/` инфра (раньше не было)

- `backend/tests/__init__.py` + `conftest.py` (sys.path трюк для `from app.services...`)
- 3 теcт-файла: `test_price_validator.py` (15) + `test_dialog_classifier.py` (18) + `test_payment_safeguard.py` (11) = **44 unit-tests**
- `pytest>=8.0.0` в requirements.txt
- Все тесты работают без БД / без сети — чистые unit'ы через stubs/SimpleNamespace

---

## Trello — состояние доски на конец сессии

`https://trello.com/b/4Dq30xBi/ex-machina`

| Колонка | Cards | Что |
|---|---|---|
| Backlog | 36 | R1 остальные, R2, R3, + `#PRICE-SEASONAL`, `#PRICE-VARIANTS`, `Intel: HotelBot` |
| Sprint 0 | 0 | `#29` → Done |
| Sprint 1 | 1 | **`#27` Админка** — core-милстоун (оставлено на завтра) |
| In Progress | 1 | `Intel: NURAI` — живая переписка с ботом, ждём ответ |
| Review | 0 | — |
| Done | 18 | 14 historical (D1-D14) + 4 сегодня (#29, INFRA-1, #24, #20) |
| Blocked | 0 | — |

Q1, Q2, Q3 decision-карточки архивированы (closed=true) с резолюцией в desc.

---

## Open actions для Алана

1. **Завтра (чт 23.04):** ждём прототип от Ольги HotelBot. Когда придёт:
   - Посмотреть формат (веб-демо / видео / созвон / ничего). 4 сценария реакции описаны в карточке `Intel: HotelBot` (https://trello.com/c/JoFLPYFL)
   - Отследить **Exely integrity test:** в комментариях/прототипе должен быть ответ про Exely. Если скажут «интегрируемся» = врут (datapoint). Если «нужна доработка» = честны.
   - Дописать результат в `docs/research/competitor_intel_2026_04.md` + перенести карточку в Done

2. **NURAI — ждём ответ бота** (3 заданных вопроса). Когда придёт — расколоть расхождение «2700 сом vs $79», уточнить отельные кейсы и Exely. Обновить intel + перенести `Intel: NURAI` из In Progress в Done с shipped-нотой.

3. **Следующий код: `#27 Админка диалогов`** (L, core-милстоун Sprint 1). Scope сужен до read-only (лента + фильтры + drill-down), двусторонний канал/ROI-кнопки — в Sprint 2. Backend endpoints + frontend страница на основе `Conversation.category` + `Conversation.last_message_at` + `Message.sender` из INFRA-1.

4. **Friday review (пт 24.04):** демо E2E 3-4 сегодняшних stories (fix_prices + classifier + payment safeguard). Если `#27` успеет — Sprint 1 закрывается целиком, готовим retro по `docs/process/retro_template.md`.

5. **Пригласить Emir в Trello** — если ещё не. Он может взять frontend-часть `#27` параллельно с backend.

---

## Что делать ПЕРВЫМ в следующей сессии

Если новый Claude открыл этот файл — делай так:

1. Прочитай новые memory из сегодня: `feedback_intel_personas.md` (не миксовать легенды), `feedback_trello_discipline.md` (закрывать карточки сразу)
2. Открой https://trello.com/b/4Dq30xBi/ex-machina — `Sprint 1 = #27 Админка`, это next code task
3. Если пришли ответы от NURAI/HotelBot — обработать intel **ПЕРВЫМ** (они теряются быстрее), только потом код
4. Для `#27` разведка: посмотреть `backend/app/api/endpoints/` — как сделан Sales Panel (паттерн endpoint per-hotel scoped). Применить тот же паттерн к `/conversations`

---

## Коммиты сессии 2026-04-22

```
31907df feat(sales): payment details field with fail-loud prompt safeguard (#20)
d254601 feat(ai): dialog category classifier + followup hook (#24)
44b47f4 feat(db): migrations 014-018 for admin dialog panel infra (INFRA-1)
d7c96f2 research: NURAI live intel + HotelBot update + monopolist insight (2026-04-22)
cf1a3d0 feat(ai): port generic fix_prices validator from Bot-Azure (#29)
```

5 коммитов, +1100 строк кода/тестов/docs. Чистый working tree (кроме untracked `.png`/`.html` Алана).

---

## Memory файлы (обновлены или созданы)

- ✅ `feedback_intel_personas.md` — НОВЫЙ (не миксовать cover stories между конкурентами)
- ✅ `feedback_trello_discipline.md` — НОВЫЙ (закрывать карточки сразу после коммита, не копить)
- ✅ `MEMORY.md` — добавлены 2 строчки индекса

---

## Статус refounding (6 фаз) — Phase 6 в активной реализации

| Фаза | Статус | Дата |
|---|---|---|
| 1. Lean Canvas | ✅ | 2026-04-20 |
| 2. Pricing v1 | ⏳ финализация после Sprint 1 | 2026-04-20 |
| 3. Competitor Intel | ✅ + live update (NURAI+HotelBot) | 2026-04-20 → 2026-04-22 |
| 4. User Story Map | ✅ | 2026-04-21 |
| 5. Process | ✅ | 2026-04-21 |
| 6. Первый осознанный спринт | 🔥 **Sprint 1 3/4 done**, `#27` осталось | 2026-04-22 |

---

*Готов к #27. Intel-треды в подвисе, ждём чт 23.04. Sprint 1 закрывается к пятнице 24.04 если #27 удастся сделать за день.*
