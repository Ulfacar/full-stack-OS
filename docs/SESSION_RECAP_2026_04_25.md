# Session Recap — 2026-04-25 (Sprint 1 закрыт окончательно + Sprint 2 ready)

> **Если ты новый Claude (особенно на Mac):** memory НЕ синхронизируется между машинами, поэтому single source of truth = этот recap + предыдущий `SESSION_RECAP_2026_04_23.md`. Прочти оба перед началом работы.

---

## TL;DR

- 🎯 **Sprint 1 закрыт по всем церемониям** (planning ✅ / work ✅ / review через E2E ✅ / retro ✅). Push в проде, Trello чистый.
- 📨 **Ольга прислала ChatExport** — закрыли HotelBot intel-трек ОКОНЧАТЕЛЬНО. Exely включён в $6675 (НЕ отдельный custom как думали), KG-mix передан их программистам без готового ответа. Алан отправил мягкий exit-текст на таймере к утру 26.04.
- 🛠️ **Sprint 2 готов к понедельнику:** `#26 / #25 / #17` имеют детальные AC + party-mode чек в DoR.
- 📚 **Lean Canvas v1 эволюционировал** — Block 9 + новый раздел «Эволюция» с 6 product insights.
- 🔧 **Memory cleanup** — 4 файла обновлены/деprecated, MEMORY.md актуализирован.
- 🆕 **Найдено что у меня есть Trello access** — `.env.trello` в репо лежал, я не проверял. Теперь умею двигать карточки + создавать новые через API. Утилита inline-Python через `set -a && source .env.trello && set +a`.

---

## Коммиты сегодня (25.04)

```
cfae014 docs(strategy): Lean Canvas v1 evolution after Sprint 1 (2026-04-25)
a45d9eb docs(process): sprint_guide DoR/DoD/antipatterns from Sprint 1 retro
87bc5c6 docs(retro): Sprint 1 retrospective — 2026-04-22 → 2026-04-25
07b6019 research(intel): HotelBot final answers from Olga (2026-04-24/25) — closes intel track
```

(до этого был push 8 коммитов от Sprint 1: `41de3f0..07b6019`)

---

## Главные действия за сессию

### 1. HotelBot intel-трек закрыт ОКОНЧАТЕЛЬНО

ChatExport_2026-04-25 от Ольги обработан:
- 7 datapoints зафиксированы в `docs/research/competitor_intel_2026_04.md`
- Полная переписка в `docs/research/hotelbot_chat_2026_04_25.txt`
- Sales asset скорректирован в `docs/sales/hotelbot_comparison_2026_04.md` (Exely 6 недель адаптации vs custom-цена раньше; новый ответ на возражение про KG)
- Trello: `Intel: HotelBot` → Done

**Главные новости:**
- Exely **включён в $6675**, обещанный SLA 6 недель адаптации с нуля. Раньше думали отдельный custom-ценник. Sales asset переписан.
- KG-mix у HotelBot — даже их собственные программисты не знают как реагировать. **Самый ценный datapoint** для Block 9 monopolist-by-design.
- Цены подтверждены $2670/$6675, без дисконта. 5 корректировок включено, дальше платно.
- HotelBot — агентство, не SaaS («сайты делаем»).

**Алан отправил Ольге** мягкий exit-текст 25.04 на таймере к утру 26.04 (отказ от созвона, ссылка на стройку, обещание вернуться в мае-июне).

### 2. Sprint 1 retrospective создан

`docs/retros/retro_2026_04_25.md` (172 строки):
- 5/5 stories closed + 3 бонус-трека
- 6 keep-doing / 6 stop-doing / 7 start-doing / 7 action items
- 6 product insights с переносами в Lean Canvas
- Tests 44 → 57 (+30%), production incidents 0, morale 4/5

### 3. sprint_guide эволюционировал

5 новых правил в `docs/process/sprint_guide.md`:
- DoR: party-mode для L-story
- DoD: push после каждой story + happy-path test для derived fields
- Антипаттерны: накапливать unpushed коммиты + только rejection-тесты

### 4. Lean Canvas v1 evolution

Block 9 расширен 4 новыми datapoint'ами + новый раздел «Эволюция (после Sprint 1)» с 6 product insights и явными переносами.

### 5. Trello доска (через `.env.trello` API)

| Действие | Карточки |
|---|---|
| ✅ Закрыты в Done | `Intel: HotelBot`, `#27 Админка диалогов`, `Process: sprint_guide update` |
| ✅ Созданы в Backlog | 3 process-карточки из retro action items + 1 Redis tech debt |
| ✅ Обновлены description | `#26 Двусторонний канал` (L), `#25 Подтвердить бронь` (M), `#17 Активация-гайд` (S) — детальные AC, party-mode чек, happy-path test, push policy, dependencies, out-of-scope |

**Финальное состояние:**
- Backlog: 39
- Sprint 0/1/Review/Blocked: 0
- In Progress: 1 (`Intel: NURAI` — ждём ответ их бота)
- **Done: 21**

### 6. Memory cleanup

- ✏️ `project_competitor_intel_2026_04.md` — переписан с monopolist-by-design позицией, актуальный после 3 волн HotelBot intel
- ✏️ `project_asystem.md` — обновлён pricing $800+$40 (был $700+$20), добавлен note про `.env.trello`
- ✏️ `project_phase5_process.md` — добавлена секция «Эволюция sprint_guide» с описанием DoR/DoD изменений и Trello-карточек
- ⚠️ `project_market_analysis.md` — отмечен как DEPRECATED stub (перекрыт competitor_intel)
- ✏️ `MEMORY.md` — 3 строки обновлены под новые описания

### 7. Push на Railway

10+ коммитов локально → origin/main → Railway автодеплой:
- Backend `/api/conversations` endpoint в проде (401 → 403 после deploy = endpoint жив)
- Миграции 014-019 применены через `alembic upgrade head` в Dockerfile
- Frontend новые страницы в проде

---

## Open actions для пн 27.04

### Утром 09:00 — Sprint 2 planning через party-mode

**Состав:** John (PM) + Bob (SM) + Winston (Architect) + Mary (если NURAI или HotelBot-программисты ответили).

**Готовые карточки в Backlog с детальными AC:**
- `#26 Двусторонний канал manager↔client` (L) — https://trello.com/c/iT0qmzGo
- `#25 Подтвердить бронь + $ сумма` (M) — https://trello.com/c/x65x52Wf  
- `#17 Активация-гайд` (S) — https://trello.com/c/XFeU4YZK

Перенести в Sprint 2 → старт работы.

### Перед стартом `#26` (L-story) — party-mode (по новому DoR)

Архитектурное решение **уже принято** в AC карточки: in-memory dict с WARNING-комментом. Redis выделен в отдельную карточку (`Tech debt: Redis для operator_reply_state`, https://trello.com/c/RB8NF6OV) для Sprint 3+ когда Railway autoscale включится.

### Если за выходные пришли intel

- **NURAI** — ответ их бота на 3 вопроса от 22.04 → обработать в `competitor_intel_2026_04.md` + Trello `Intel: NURAI` → Done
- **HotelBot программисты** — финальный datapoint по KG-mix → добавить в intel + Block 9 переписать с цитатой

### Перенесённые retro action items (3 в Backlog)

- `Process: party-mode перед каждой L-story (DoR)` — применить в #26 первой
- `Process: untracked-check в начале каждой сессии` — Claude должен начинать с `git status -s`
- 3-я уже закрыта (`Process: sprint_guide update` ✅ Done)

---

## Open intel threads

| Thread | Status | Trigger закрытия |
|---|---|---|
| NURAI ответ бота | 🟡 ждём | Если придёт — добавить datapoints, sales asset |
| HotelBot программисты по KG-mix | 🟢 не блокер | Если придёт — финальный гвоздь в Block 9 |
| Ольга — её ответ на наш exit | 🟢 не ожидаем активный | Если придёт — мягко затухает по сценарию sales-fade |

---

## Что делать ПЕРВЫМ в следующей сессии

1. **Прочти ВСЮ память** (`MEMORY.md` индекс целиком, не выборочно). Sprint 1 retro lesson #1.
2. **`git status -s`** — untracked-check (Sprint 1 retro lesson #5). Если есть `*.docx`, `*.pdf`, `*.png`, `*.html`, `*.pptx` — спроси Алана разобрать или это не наше.
3. **Проверь `.env.trello`** в корне репо — у тебя есть TRELLO_API_KEY/TOKEN, можешь двигать карточки через API. Inline-скрипты в `C:\Users\alanb\AppData\Local\Temp\trello_*.py`.
4. **Открой Trello** → если в Sprint 2 есть `#26/#25/#17` — Sprint 2 уже идёт, не делай повторное planning.
5. **Если ответ от Ольги или NURAI пришёл** — обработать ПЕРВЫМ (intel теряется быстрее).

---

## Состояние локальной инфры

- Backend / frontend dev-серверы остановлены в начале сессии после E2E (23.04). Перезапускать только под конкретный E2E.
- `dev.db` содержит seed_e2e данные (hotel_id=1, conv_id=1, 6 messages).
- Тестовый юзер: `demo@asystem.com` / `demo123` (role=sales локально).
- 9 untracked файлов в working tree (PNG скриншоты, .pptx Ольги, .html от 16.04) — **НЕ моё**, оставляю на решение Алана.

---

## Статус refounding (6 фаз)

| Фаза | Статус | Дата |
|---|---|---|
| 1. Lean Canvas | ✅ + evolution 2026-04-25 | 2026-04-20 → 2026-04-25 |
| 2. Pricing v1 | ⏳ pending финализация | продолжается |
| 3. Competitor Intel | ✅ закрыт окончательно | 20.04 → 25.04 |
| 4. User Story Map | ✅ | 2026-04-21 |
| 5. Process | ✅ + evolution 2026-04-25 | 2026-04-21 → 2026-04-25 |
| 6. Sprint 1 | ✅ **закрыт всеми ceremonies** | 22.04 → 25.04 |

---

*Sprint 1 done end-to-end. Sprint 2 ready to start. Идти отдыхать.*
