# Session Recap — 2026-04-20 (Ex-Machina refounding)

> **Если ты новый Claude, который это читает:** Алан сегодня сделал огромную сессию после бизнес-тренинга. Это файл-мост. Прочти его, потом по ссылкам ниже — войдёшь в контекст без пересказов.

---

## TL;DR — что произошло

Алан вернулся с бизнес-тренинга, получил инсайты, запустил **фундаментальное переосмысление Ex-Machina** через 6 фаз:

1. Lean Canvas
2. Pricing model + tokens economics
3. Competitive intelligence
4. User Story Map
5. Process setup (Trello + спринты + ретро)
6. Первый осознанный спринт

**Завершено за 2026-04-20:** Фазы 1, 2, 3. Остались 4, 5, 6 + Sprint 0 (tech debts).

---

## Ключевые решения и артефакты

### Фаза 1 — Lean Canvas v1 ✅
**Файл:** `docs/strategy/lean_canvas_v1.md`

**Решения:**
- **ЦА = мини-отели 15-40 номеров** (core ICP) + micro 5-14 (tier 2, self-serve в Release 2)
- **НЕ наша ЦА:** сети 100+, хостелы, санатории, управляющие-наёмники, гостевые дома <5
- **УЦП:** «AI-менеджер 24/7, окупается с первой сохранённой брони, один платёж всё включено»
- **Термин:** «AI-менеджер», не «AI-админ»
- **R1 честность:** «бот ловит лид, менеджер оформляет»; **R2 июнь 2026:** «бот сам закрывает через Exely Distribution API»
- **TAM КР:** 400-800 мини-отелей, SAM (Иссык-Куль север + Бишкек) 220-440, SOM 22-44
- **Unfair Advantage (6 пунктов):** hotel-специализация, Назира-эксклюзив, Shelter-партнёрство, Exely early access, Ton Azure кейс, proprietary data moat
- **Kyrgyz язык = hygiene, не selling point** (6% диалогов в Ton Azure)

### Фаза 2 — Pricing model v1 ✅
**Файл:** `docs/strategy/pricing_model_v1.md`

**Решения:**
- **Рабочий tariff до финализации: Business v3 — $800 setup + $40/мес** (Wappi/OpenRouter/VPS В БАЗЕ — это revenue stream Алана, не passthrough)
- **Pricing philosophy:** клиент видит один платёж, всё включено, без раскладки
- **Комиссия Назиры:** 37.5% one-time с setup (как на Ton Azure $300/$800)
- **Реальные данные Ton Azure (17 дней апрель 2026):** ~3 диалога/день, ~10 msg/диалог, ~$1/мес на OpenRouter
- **Unit econ Founder frame (Alan время = $0):** Year 1 +$638, Year 2+ +$138 — **жизнеспособно**
- **Pro tier $1500+$50:** не продвигаем активно, только по запросу
- **Финализация отложена в Фазу 5 через Trello-карточку** «Pricing finalization»

### Фаза 3 — Competitive intel ✅
**Файл:** `docs/research/competitor_intel_2026_04.md`

**Решения:**
- **🚨 NURAI (Бишкек) — главный прямой конкурент:** Бектур Адиев + Булат Сайфудинов, 20+ КР-клиентов incl. hotels, implementation 1-3 дня, WA+TG+CRM, расширение в КЗ/УЗ 2026-27. **Подтверждено Аланом:** Бектур Адиев из NURAI ≠ Бектур из Ton Azure (просто тёзки). Защитная стойка снята.
- **Gerabot = dev-agency**, не SaaS-конкурент
- **Hotbot.ai = upsell-bot**, не конкурирует в первичной коммуникации
- **AI Studio = Enterprise кастом** ($1200-6000 one-time, Marriott/Hilton)
- **HiJiffy / Asksuite = global EN**, не в КР
- **Shelter.kg** = PMS-лидер КР без AI-бота → **главная партнёрская opportunity, приоритет Фазы 5**
- **5 gap'ов зафиксированы:** hotel-специализация vs NURAI general, Shelter-integration, underserved 15-40, setup неделя vs 2 мес Gerabot, Ton Azure local case
- **Updated Блок 9 Lean Canvas** с учётом NURAI
- **Финализация + обновление Unfair Advantage — в Фазу 5 через Trello**

### Sprint 0 (Task #7) — Tech debts discovered ⏳ pending
**Verified 5 debts (см. Appendix C в lean_canvas_v1.md):**
1. ❌ `fix_prices` / `ensure_room_variants` — нет в Ex-Machina, port из Bot-Azure нужен
2. ❌ Поле `payment_details` в Hotel модели — нет, сейчас заглушка `[РЕКВИЗИТЫ]`
3. ❌ Google Sheets интеграция — нет
4. ❌ Тумблер `pms_provider` в Hotel — нет (Exely хардкод)
5. ❌ Multi-manager модель — есть только один `Hotel.manager_telegram_id`, нужно 2-4/отель

**Без них нельзя продавать новому отелю — обжигаем первого клиента.**

---

## Открытые actions (Алан делает или держит в голове)

### Outreach под персоной «Айгуль Сатыбалдиева» (готовые тексты в сессии + в competitor_intel файле)
- [ ] Отправить NURAI через Instagram DM `@nurai_kg_`
- [ ] Отправить Hotbot.ai через форму на сайте
- [ ] Отправить AI Studio через форму
- [ ] Собрать ответы 3-7 дней, переслать Claude в новой сессии → синтез в Фазе 5

### Персона Айгуль — детали для consistency
- Айгуль Сатыбалдиева, 38 лет, муж Кайрат
- Отель «Ак-Марал», бутик, 22 номера, Чолпон-Ата (Иссык-Куль)
- Работает 4 года, сама + 2 админа в смены
- Гости: 70% КР / 20% КЗ / 10% РФ
- PMS сейчас Google Sheets, планирует Shelter
- Пик июнь-август ×2, ночью никого
- Бюджет: до $1500 setup, до $60/мес

### Другие actions
- [ ] Защитить отношения с Бектуром Ton Azure (регулярный support, не терять)
- [ ] Формализовать эксклюзив Назиры контрактом (30-40% setup + не продаёт конкурирующих hotel-bot)
- [ ] Outreach Shelter.kg для партнёрства (Фаза 5 приоритет)
- [ ] Технический тест Shelter API GeoIP с Contabo DE (может блокировать немецкие IP, как МойСклад)

---

## Что делать ПЕРВЫМ в следующей сессии

**Claude, прочти:**
1. Этот файл (уже прочитал)
2. `docs/strategy/lean_canvas_v1.md` (главный стратегический документ)
3. `docs/strategy/pricing_model_v1.md` (экономика)
4. `docs/research/competitor_intel_2026_04.md` (конкуренты + gap-анализ)
5. Если доступен `C:\Users\alanb\.claude\plans\radiant-soaring-cascade.md` — план 6 фаз

**Спроси Алана:**
1. Пришли ли ответы от NURAI / Hotbot / AI Studio? Есть что добавить в intel?
2. Готов идти в Фазу 4 (User Story Map) или пока другое дело?
3. Готов начать Sprint 0 code work (port fix_prices + payment_details field + etc.)?

**По умолчанию, если Алан скажет «продолжаем план» — следующая фаза = Фаза 4 (Task #4).** Это USM для мини-отеля = путь Айгуль от «узнала о нас» до «платит 3-й месяц», разложенный на user stories c $ impact labels, приоритизированный по Release 1/2/3. Результат — готовый backlog для Trello (Фаза 5).

---

## Память (в C:\Users\alanb\.claude\ — может быть НЕ на ноуте)

Если Claude не видит эти файлы — это нормально, всё важное в этом recap:

- `memory/MEMORY.md` — индекс всех memo
- `memory/project_exmachina_refounding_2026_04.md` — план 6 фаз
- `memory/project_lean_canvas_v1_decisions.md` — фаза 1 решения
- `memory/project_competitor_intel_2026_04.md` — фаза 3 решения
- `memory/feedback_client_validation.md` — не спрашивать платящего клиента валидацию
- `memory/feedback_workflow_ex_machina.md` — модульные коммиты, BMad party mode
- `plans/radiant-soaring-cascade.md` — полный план Фаз 1-6

**Если ничего из этого нет — всё нужное есть в `docs/strategy/`, `docs/research/` и в этом recap-файле.**

---

## Task list (остался в Claude Code — может не восстановиться на ноуте)

| # | Задача | Статус |
|---|--------|--------|
| 1 | Фаза 1: Lean Canvas v1 | ✅ completed |
| 2 | Фаза 2: Pricing model + tokens | ✅ completed |
| 3 | Фаза 3: Competitive intel | ✅ completed |
| 4 | Фаза 4: User Story Map | ⏳ pending, unblocked |
| 5 | Фаза 5: Process setup + Trello | ⏳ pending, blocked by #4 |
| 6 | Фаза 6: Первый спринт | ⏳ pending, blocked by #5, #7 |
| 7 | Sprint 0: tech debts | ⏳ pending, unblocked |

**Если Claude на ноуте не видит task list — пересоздаст по этой таблице.**

---

## Контакты и связи упомянутые сегодня

- **Бектур Адиев** (+996 775 587533) — клиент Ton Azure, НЕ co-founder NURAI (подтверждено Аланом)
- **Назира** — партнёр-продажник с 37.5% комиссией, нужен эксклюзив
- **Булат Сайфудинов** — co-founder NURAI (технический)
- **Бектур Адиев** (NURAI) — co-founder NURAI (коммерческий), ТЁЗКА клиента Ton Azure
- **Владелица Skeramos** — заморожен, вернутся сами когда операционно готовы
- **Emir** — партнёр-фронт Алана

---

## Последнее слово

Алан закрыл 8-часовую сессию, устал, пошёл отдыхать. Следующая сессия — когда будет на силах, ожидается через день-два. В этот recap записано ВСЁ что нужно для seamless pickup.

*С Алан — твой предыдущий я, Claude Opus 4.7 на Windows-десктопе, сессия 2026-04-20.*
