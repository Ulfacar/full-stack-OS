# Session Recap — 2026-04-21 (Ex-Machina refounding — Phases 4 + 5)

> **Если ты новый Claude, который это читает:** сегодня закрыты сразу **две фазы** переосмысления (USM + Process/Trello). В сумме за 2 дня (20-21 апреля) — 5 из 6 фаз плана `radiant-soaring-cascade.md`. Остался Phase 6 — первый осознанный спринт (код).

---

## TL;DR — что произошло

- ✅ **Фаза 4 (USM)** закрыта — 7 activities, 37 stories с $-импактом и R1/R2 релизами
- ✅ **Фаза 5 (Process)** закрыта — sprint guide, retro template, Trello-доска с **51 карточкой** online
- 🔥 **HotelBot intel** — новый конкурент, цены $2670/$6675 выпытаны под персоной «сын владельцев»
- 📋 **Trello** — https://trello.com/b/4Dq30xBi/ex-machina (14 Done + 1 Sprint 0 + 4 Sprint 1 + 32 Backlog)

---

## Ключевые решения и артефакты

### 1. User Story Map v1 (Фаза 4)

**Файл:** `docs/strategy/user_story_map_v1.md`

- **Backbone:** Hear → Evaluate → Trial → Buy → Activate → Run → Renew (7 activities, один actor = владелец для R1)
- **Tasks:** 27 действий клиента
- **Stories:** 37 штук, каждая с `$ impact` меткой
- **MoSCoW внутри R1:** R1a Must (9) / R1b Should (6) / R1c Could (10) / Won't (11) → R2
- **Топ-5 R1 money stories:** #33 Monthly ROI, #25 Подтвердить бронь+$, #17 активация-гайд, #29 fix_prices порт, #8 ROI-калькулятор
- **Blocker-граф:** миграции 014-018 → #24 категория → #27 /conversations → #26 двусторонний канал → #25 → #33
- **Разведка Ton Azure (Playwright):** ROI-отчёта нет, фундамент есть (кнопка «Подтвердить бронь» + категоризация)

**Память:** `project_user_story_map_v1.md` в `~/.claude/projects/.../memory/`

### 2. Process setup (Фаза 5)

**Файлы:**
- `docs/process/sprint_guide.md` — 1-week sprint, DoR/DoD, 7 Trello-колонок, 9 labels, антипаттерны
- `docs/process/retro_template.md` — 4 колонки + метрики + product insights
- `docs/process/trello_seed_r1.md` — source-of-truth 51 карточка (14 DONE + 37 R1/R2)
- `scripts/seed_trello.py` — автозагрузка в Trello API

**Trello-доска:** https://trello.com/b/4Dq30xBi/ex-machina

**Расклад карточек:**
- Done: 14 (история shipped #D1-#D14)
- Sprint 0: 1 (#29 fix_prices порт)
- Sprint 1: 4 (#17, #20, #24, #10)
- Backlog: 32 (остальные R1a/R1b/R1c/R2)

**Креды Trello:** лежат в `.env.trello` (gitignored, не в репо).

**Память:** `project_phase5_process.md`

### 3. HotelBot — новый конкурент (intel-сессия 2026-04-21)

**Файл обновлён:** `docs/research/competitor_intel_2026_04.md` (новая секция после Hotbot.ai, **⚠️ разные компании**).

**Ключевые цифры (подтверждены в TG-переписке Алана под персоной «сын владельцев»):**
- $2670 — one-time лицензия **без настройки** (клиент сам ставит)
- $6675 — полный пакет с внедрением + 3 мес сопровождения
- **Подписки НЕТ**, после 3 мес — отдельный договор
- Кыргызский бесплатно добавляется (claim, проверим по прототипу)
- PMS: Bnovo, 1С, МойСклад, Travelline. **НЕТ Exely, НЕТ Shelter**
- Канал: КП говорит TG-only, РОП в чате «любой мессенджер» — противоречие
- Кейс: гостевой дом Абхазия 40 номеров (900+ диалогов первый месяц)

**Gap-таблица (наш TCO 1-го года $1280 vs их $6675 = в 5× дешевле).**

**Висячий хвост:**
- Прототип обещан на четверг 2026-04-23 — РОП Бускова Ольга пришлёт ссылку
- После проверки прототипа — допишем в intel (реально ли WA, UX, качество русского)
- Ольга ушла «до завтра» (22:34 Москва = 23:34 Бишкек) — если напишет, продолжаем

**Память:** обновлён `project_competitor_intel_2026_04.md`.

---

## Open actions для Алана

1. **Завтра-послезавтра: Sprint 0 — порт `fix_prices` + `ensure_room_variants`** из Bot-Azure в Ex-Machina `ai_service.py`. 1 день работы, без блокеров. Карточка `#29` уже в Sprint 0 колонке Trello.

2. **В четверг 2026-04-23:** ждём прототип от Ольги HotelBot. Когда пришлёт:
   - Открыть, погонять (можно записать видео через OBS)
   - Проверить: реально ли WA, качество ответов на русском, как с Exely, есть ли handoff
   - Дописать секцию «Обновить после четверга» в `competitor_intel_2026_04.md`

3. **Monday planning (понедельник 2026-04-27):** открыть Trello, из Sprint 1 колонки выбрать 3-4 карточки на первую реальную неделю. Кандидаты уже расставлены: #17, #20, #24, #10.

4. **Phase 6 стартует:** после Sprint 0 + 1 проведи первое ретро по `docs/process/retro_template.md` → `docs/retros/retro_2026_05_03.md`.

5. **Trello:** пригласи **Emir** в доску (кнопка Invite в правом верхнем углу `4Dq30xBi`). Он увидит весь R1 scope и сможет брать frontend-story.

---

## Что делать ПЕРВЫМ в следующей сессии

Если новый Claude открыл этот файл — делай так:

1. Прочитай `project_exmachina_state.md`, `project_user_story_map_v1.md`, `project_phase5_process.md` в памяти (они уже в MEMORY.md индексе)
2. Открой Trello https://trello.com/b/4Dq30xBi/ex-machina — увидишь текущее состояние работ
3. Смотри колонку **Sprint 0** — там `#29 fix_prices` порт. Это next code task
4. Если Алан скажет «продолжим HotelBot» — в `docs/research/competitor_intel_2026_04.md` найди секцию «Обновить после четверга», туда допиши данные из прототипа

---

## Коммиты сессии 2026-04-21

```
1fa4993 research: HotelBot intel — цены $2670/$6675 (intel-сессия 2026-04-21)
933163b chore: ignore .env.trello (local Trello API creds)
eb5855e feat(process): добавить DONE-секцию в Trello seed (14 shipped фич)
4fdca3c feat(scripts): seed_trello.py — авто-загрузка Trello-доски из markdown
afd0634 docs(process): Trello seed — 37 карточек R1/R2 из USM v1
31f8b4e docs(process): retro template — 4 колонки + метрики + product insights
a0ccd20 docs(process): sprint guide v1 — 1-week cycle, solo-dev ceremonies
514891d docs: User Story Map v1 — Фаза 4 refounding закрыта (2026-04-21)
```

Итого **8 коммитов**, ~2000+ строк markdown/code добавлено.

---

## Task list — финальное состояние

| # | Задача | Статус |
|---|---|---|
| 1 | Фаза 4: backbone активностей | ✅ completed |
| 2 | Фаза 4: layer-2 tasks | ✅ completed |
| 3 | Фаза 4: layer-3 stories + $ impact | ✅ completed |
| 4 | Фаза 4: записать user_story_map_v1.md | ✅ completed |
| 5 | Фаза 4: update memory | ✅ completed |
| 6 | Фаза 5: sprint_guide.md | ✅ completed |
| 7 | Фаза 5: retro_template.md | ✅ completed |
| 8 | Фаза 5: trello_seed_r1.md | ✅ completed |
| 9 | Фаза 5: scripts/seed_trello.py | ✅ completed |
| 10 | Фаза 5: update memory + коммиты | ✅ completed |

---

## Memory файлы (обновлены или созданы)

- ✅ `project_user_story_map_v1.md` — новый
- ✅ `project_phase5_process.md` — новый
- ✅ `project_competitor_intel_2026_04.md` — добавлена секция HotelBot
- ✅ `MEMORY.md` — добавлены две строчки индекса

---

## Прогресс refounding (6 фаз)

| Фаза | Статус | Дата закрытия |
|---|---|---|
| 1. Lean Canvas | ✅ | 2026-04-20 |
| 2. Pricing v1 | ⏳ промежуточно ($800+$40), финализация в Фазе 6 | 2026-04-20 |
| 3. Competitor Intel | ✅ +HotelBot update | 2026-04-20 / 2026-04-21 |
| 4. User Story Map | ✅ | **2026-04-21** |
| 5. Process (Trello+ceremonies) | ✅ | **2026-04-21** |
| 6. Первый осознанный спринт | 🎯 Sprint 0 стартует | следующая сессия |

---

*Готов к Phase 6 — первому реальному коду после refounding. Все planning-артефакты на месте. Next: `#29 fix_prices` порт.*
