# Ex-Machina — Pricing Model v1

> **Статус:** DRAFT в работе. Фаза 2 плана `radiant-soaring-cascade.md`.
> **Дата:** 2026-04-20
> **Автор:** Алан + Claude
> **Вход:** Lean Canvas v1 (Блоки 1-5, 9). Выход: Блоки 6-8 Lean Canvas + решение по тарифам.

---

## Цель документа

Ответить на 4 вопроса:

1. Сколько **токенов в месяц** тратит средний отель нашего сегмента? Как это масштабируется с размером (17 номеров vs 80)?
2. Какая **маржа** при текущем прайсинге $700 setup + $20/мес?
3. Сколько **клиентов нужно** для breakeven, для $1k/мес прибыли, для $10k/мес прибыли?
4. Какой **тариф предложить** клиенту: подписка vs разовая vs гибрид? Сколько tier'ов и где границы?

---

## Текущее состояние (что есть в коде Ex-Machina)

**Hotel.monthly_budget** = $5.0 (default) — бюджет на токены
**Billing.amount** = $20 (default) — подписка $/мес (хардкод)
**Hotel.ai_model** = `anthropic/claude-3.5-haiku` (default) — Haiku через OpenRouter

**OpenRouter Haiku цены (апрель 2026, сверить):**
- Input: ~$0.25 / 1M токенов
- Output: ~$1.25 / 1M токенов
- Среднее ~$0.75 / 1M при 50/50 input/output

Средняя беседа отельного бота: 5-10 сообщений × 500 токенов каждое (input+output+system prompt) = ~3000-5000 токенов/диалог.

---

## Реальные данные — нужны из Bot-Azure (Ton Azure DB)

**Проблема:** Ex-Machina DB ещё пустая по реальному трафику. Ton Azure работает на отдельном VPS (Bot-Azure repo), там 51+ диалог за 6 месяцев.

### SQL-запросы для Ton Azure Claude (отправить ему)

Чтобы мы могли построить реалистичную модель, нужно выгрузить агрегаты из Bot-Azure DB. Копипаст для Ton Azure Claude:

> Выгрузи из Bot-Azure DB следующие агрегаты (SQL / Python-запрос — не важно, нужны только итоговые цифры):
>
> **Q1. Общий расход токенов за всё время работы Ton Azure:**
> ```sql
> SELECT
>   COUNT(*) AS total_ai_calls,
>   SUM(prompt_tokens) AS total_prompt_tokens,
>   SUM(completion_tokens) AS total_completion_tokens,
>   SUM(cost_usd) AS total_cost_usd,
>   MIN(created_at) AS first_call,
>   MAX(created_at) AS last_call
> FROM ai_usage;
> ```
>
> **Q2. Расход по месяцам (чтобы увидеть тренд / сезонность):**
> ```sql
> SELECT
>   TO_CHAR(created_at, 'YYYY-MM') AS month,
>   COUNT(*) AS ai_calls,
>   SUM(prompt_tokens + completion_tokens) AS total_tokens,
>   SUM(cost_usd) AS cost_usd
> FROM ai_usage
> GROUP BY month
> ORDER BY month;
> ```
>
> **Q3. Среднее на один AI-вызов / один диалог:**
> ```sql
> SELECT
>   AVG(prompt_tokens) AS avg_prompt,
>   AVG(completion_tokens) AS avg_completion,
>   AVG(cost_usd) AS avg_cost_per_call
> FROM ai_usage;
>
> SELECT
>   AVG(tokens_per_conv) AS avg_tokens_per_conversation,
>   AVG(cost_per_conv) AS avg_cost_per_conversation
> FROM (
>   SELECT conversation_id,
>          SUM(prompt_tokens + completion_tokens) AS tokens_per_conv,
>          SUM(cost_usd) AS cost_per_conv
>   FROM ai_usage
>   WHERE conversation_id IS NOT NULL
>   GROUP BY conversation_id
> ) sub;
> ```
>
> **Q4. Количество уникальных диалогов и сообщений:**
> ```sql
> SELECT
>   COUNT(DISTINCT conversation_id) AS unique_conversations,
>   COUNT(*) FILTER (WHERE role='user') AS user_messages,
>   COUNT(*) FILTER (WHERE role='assistant') AS bot_messages,
>   MIN(created_at) AS first_msg,
>   MAX(created_at) AS last_msg
> FROM messages;
> ```
>
> **Q5. Пиковые дни (есть ли сезонность уже?):**
> ```sql
> SELECT
>   DATE(created_at) AS day,
>   COUNT(*) AS msgs,
>   COUNT(DISTINCT conversation_id) AS dialogs
> FROM messages
> WHERE role='user'
> GROUP BY day
> ORDER BY msgs DESC
> LIMIT 10;
> ```
>
> Верни цифрами, не SQL. Если schema отличается от Ex-Machina — адаптируй, главное — концепция запросов.

---

## Рабочая гипотетическая модель (пока нет данных Ton Azure)

Пока ждём реальные цифры — строю оценку на industry-benchmarks.

### Допущения

- **Средний бутик-отель 15-40 номеров:** ~20-60 входящих сообщений/день (сезонные пики ×2).
- **Средний диалог:** 5-10 обменов = 10-20 сообщений.
- **Conversational AI avg:** 500-800 токенов/запрос (system prompt + history + новое сообщение + ответ).
- **Стоимость Haiku (OpenRouter):** input $0.25/1M, output $1.25/1M → mixed ~$0.75/1M.
- **Cross-dialog memory** (подтягиваем 10 msg из 3 предыдущих диалогов) увеличивает prompt_tokens в 1.5-2x vs «чистого» диалога.

### Расчёт по tier'ам (гипотеза, проверить по данным)

| Tier | Номера | Сообщ/день | Сообщ/мес | Токены/мес | Cost OpenRouter/мес |
|------|--------|-----------|-----------|-----------|---------------------|
| **S (Micro)** | 5-14 | 10 | 300 | 300k | $0.23 |
| **M (Mini)** | 15-40 | 30 | 900 | 900k | $0.68 |
| **L (Extended)** | 40-80 | 80 | 2400 | 2.4M | $1.80 |
| **XL** | 80+ | 150 | 4500 | 4.5M | $3.38 |

**Сезонный пик лето (×2):** M-tier в июле-августе = $1.36/мес.

### Другие расходы (per hotel, per month)

- **VPS/serverless doля:** ~$12/мес VPS распределён на N отелей → при 10 клиентах = $1.2/отель
- **Wappi.pro:** ~$25/мес на прогретый номер (если не Meta Cloud)
- **Meta Cloud API:** ~$0.005-0.01/conversation (маленький)
- **Backup/monitoring:** ~$5/мес распределённо
- **Support (Алан time):** $50/мес/клиент (30 мин/мес × $100/час)

**Итого marginal cost M-tier:** ~$30-35/мес (с Wappi, Support, share VPS).

### Unit-экономика при $20/мес

- Revenue: $20
- Cost: ~$30-35
- **Margin:** -$10-15 ❌

**$20/мес убыточно при M-tier с Wappi и Support.** Это подтверждает инсайт №5 Алана (не выдержит 80-номерных отелей).

### Unit-экономика при гибриде $700 setup + $30/мес

- Year 1 Revenue: $700 + $30×12 = $1060
- Year 1 Cost: setup (Alan 20h × $30/h = $600) + 12×$35/мес (Support + Wappi + LLM + share) = $1020
- **Year 1 Margin:** +$40 ❌ почти 0

### Unit-экономика при тарифах S/M/L (гипотеза)

| Tier | Setup | Monthly | Annual Rev | Est. Annual Cost | Margin year 1 | Margin year 2+ |
|------|-------|---------|-----------|-----------------|---------------|----------------|
| **S** | $300 | $15 | $480 | $300 + $200 = $500 | -$20 | +$0? |
| **M** | $700 | $30 | $1060 | $600 + $420 = $1020 | +$40 | +$640 |
| **L** | $1500 | $50 | $2100 | $900 + $600 = $1500 | +$600 | +$1500 |

**Ключевые наблюдения:**
1. **Year 1 маржа небольшая** из-за setup-времени Алана. Это **инвестиция** в LTV.
2. **Year 2+ маржа огромная** (80%+) — setup amortized, остаётся monthly cost ~$35.
3. **S-tier убыточен в year 1** — оправдан только если self-serve (без Алана в onboarding) → Release 2.
4. **L-tier очень привлекателен** — но токены больше не в 3-4x как мы думали, а всего в 2-3x (OpenRouter Haiku дешёвый). Реальная разница — **время Алана на сложный onboarding**, а не токены.

---

## Варианты структуры тарифа

### Вариант A — «Простой гибрид» (мой кандидат)

| Tier | Setup | Monthly | Для кого |
|------|-------|---------|----------|
| **Starter** | $300 | $15 | Micro 5-14 (self-serve Release 2, сейчас не продаём) |
| **Business** | $700 | $30 | Mini 15-40 (core ICP, продаём Назирой) |
| **Pro** | $1500 | $50 | Extended 40-80 (крупные, по запросу) |

**Плюсы:** понятно, 3 размера, гибрид. Без токен-метрик для клиента.
**Минусы:** не учитывает трафик внутри одного tier'а (отель с 20 или 40 номерами — одинаковая цена).

### Вариант B — «Setup + токен-based monthly»

| Tier | Setup | Monthly base | Overage |
|------|-------|--------------|---------|
| Все | $700 | $20 (включает 1000 сообщ/мес) | +$0.02/сообщ свыше |

**Плюсы:** честно под трафик.
**Минусы:** клиент боится «а сколько с меня возьмут в сезон» — противоречит pricing philosophy «один платёж всё включено».

### Вариант C — «All-you-can-eat с жёстким лимитом tier'а»

| Tier | Setup | Monthly | Лимит |
|------|-------|---------|-------|
| **Business** | $700 | $30 | До 2000 сообщ/мес, потом upgrade на Pro |
| **Pro** | $1500 | $50 | Без лимита |

**Плюсы:** клиенту понятно, лимит как upgrade-триггер.
**Минусы:** если клиент не знает что у него много трафика — неожиданность.

### Вариант D — «Чисто подписка, без setup» (растягиваем setup в LTV)

| Tier | Setup | Monthly |
|------|-------|---------|
| **Business** | $0 | $80 |
| **Pro** | $0 | $130 |

**Плюсы:** низкий барьер входа, классический SaaS. Месяц 1-2 — $160 = сопоставимо с setup-fee.
**Минусы:** высокий churn в первые 3 месяца (если клиент не видит value — уходит, мы не окупили setup-время).

---

## Рекомендация (предварительная)

**Вариант A — Простой гибрид** с 3 tier'ами (Starter / Business / Pro).

Обоснование:
- **Pricing philosophy «один платёж всё включено»** — сохраняем.
- **Psychology of commitment:** setup-fee — это «я купил, я владею», higher engagement.
- **Маржа year 2+ хорошая** — долгосрочно окупается.
- **Tier'ы понятны Назире** (легко продавать «это для вас Business за $700»).
- **Starter (Micro)** — не продаём Назирой, только self-serve в Release 2. Зарезервирован.

**Что НЕ делаем:**
- Не усложняем токен-метриками в первых 20 клиентах.
- Не переходим на чистую подписку (D) — risky для small-team ventures.

---

## ⚠️ UPDATE 2026-04-20 — Unit-экономика показывает УБЫТОК при $700+$30

### Fixed assumptions (committed defaults)
- Wappi в нашей цене: включаем ($25/мес на прогретый номер)
- Комиссия Назиры: 37.5% one-time с setup-fee
- Setup-время Алана: 20h среднее (30h на первый, 15h на 10-й)
- Pro tier: не продвигаем, только по запросу клиента

### Пересчёт Business tier $700 + $30/мес

**Year 1 (per hotel):**

| Статья | $ |
|--------|---|
| Revenue setup | +$700 |
| Revenue subscription (12 мес) | +$360 |
| **Total revenue** | **+$1060** |
| ─── | ─── |
| Комиссия Назире (37.5% × $700) | -$262.50 |
| Setup-время Alan (20h × $30/h условно) | -$600.00 |
| OpenRouter токены (12 × $0.68) | -$8.20 |
| Wappi.pro (12 × $25) | -$300.00 |
| VPS / backup share (12 × $2) | -$24.00 |
| Support Alan (12 × 30 мин × $30/h = $15/мес × 12) | -$180.00 |
| Meta Cloud API (~$0.01 × 1000 msg) | -$10.00 |
| **Total cost** | **-$1384.70** |
| **MARGIN Year 1** | **-$324.70 ❌** |

**Year 2+ (steady state, per hotel):**

| Статья | $ |
|--------|---|
| Revenue subscription (12 мес) | +$360 |
| ─── | ─── |
| OpenRouter токены | -$8.20 |
| Wappi.pro | -$300 |
| VPS share | -$24 |
| Support Alan | -$180 |
| Meta API | -$10 |
| **Total cost** | **-$522.20** |
| **MARGIN Year 2+** | **-$162.20 ❌** |

### Вывод: **$700 + $30/мес убыточно даже на steady-state**

Главные жрущие маржу статьи:
1. **Wappi.pro $300/год** — огромная статья, 83% operating cost.
2. **Support time Алана $180/год** — 6 часов в год на клиента, реалистично?
3. **Setup-время Алана $600** (year 1) — самая большая year-1 статья.
4. **Комиссия Назиры $262.50** — большая year-1 статья.

### Варианты «спасения» экономики

**V1. Поднять subscription до $60/мес.**
- Year 2+ margin: $60×12 - $522 = +$198/год ✅
- Но: Gerabot $18/мес — мы в 3x дороже. Нужно УЦП-обоснование.

**V2. Снять Wappi (клиент заводит Meta Cloud сам).**
- Экономия $300/год/клиент.
- Year 2+ margin при $30/мес: $360 - $222 = +$138/год ✅
- Но: УЦП «всё включено» ломается, часть клиентов без WA Business.
- Компромисс: Wappi опция за доп $25/мес ИЛИ Meta Cloud в стандарте.

**V3. Поднять setup до $1200 + $30/мес (мотивирует комиссию Назиры).**
- Year 1 revenue: $1560. Cost = $1384 + $450 (Назира 37.5% доп). Margin $-274 ещё хуже.
- Если Назира фиксирует комиссию в $300 (не процент): Year 1 cost ~$1135. Margin +$425 ✅
- Фиксированная комиссия — договорная гипотеза.

**V4. Снизить setup-время до 10h (агрессивная автоматизация визарда).**
- Year 1 margin при $700+$30: -$24.7 (почти 0)
- Year 2+ без изменений.
- Задача: довести визард до «чек-лист + автогенерация промпта» так чтобы Alan вмешивался минимально.

**V5. Убрать support Алана (self-service поддержка через FAQ/docs).**
- Year 2+ экономия $180/год.
- Не реалистично пока <20 клиентов — нужна hands-on culture.

### 🎯 Рабочая финальная рекомендация (до Фазы 5)

**Business tier v3: $800 setup + $40/мес, Wappi/OpenRouter/VPS В БАЗЕ.**

**Принцип Alan'а (2026-04-20):** «Wappi Pro, сервер и OpenRouter должны входить в ежемесячный платёж — это мой дополнительный доход». То есть bundled cost = revenue stream, не просто passthrough. Клиент видит один платёж «всё включено» (per УЦП).

| Статья | Year 1 | Year 2+ |
|--------|--------|---------|
| Revenue setup | +$800 | — |
| Revenue subscription | +$480 | +$480 |
| **Total revenue** | **+$1280** | **+$480** |
| OpenRouter (реально из Ton Azure: ~$1/мес) | -$12 | -$12 |
| Wappi.pro | -$300 | -$300 |
| VPS / backup share | -$24 | -$24 |
| Meta Cloud API | -$6 | -$6 |
| Support Алана (20 мин/мес) | -$120 | -$120 |
| Setup Алана (20h первые, 10h с визардом) | -$600 (20h) / -$300 (10h) | — |
| Комиссия Назире 37.5% one-time | -$300 | — |
| **Total cost (accountant frame)** | **-$1362 / -$1062** | **-$462** |
| **Margin year 1 (accountant frame)** | **-$82 / +$218** | **+$18 ✅** |
| **Margin year 1 (founder frame — Алан время = $0)** | **+$638 / +$738** | **+$138 ✅** |

**Вывод:**
- **Founder frame** (твоё время равно 0) — тариф жизнеспособен с первого клиента.
- **Accountant frame** (твоё время оценено в $30/час) — Year 1 около нуля или тонкий плюс. Year 2+ — мало, надо масштабировать клиентов.
- **При 20 клиентах год 1 (founder frame):** revenue $25.6k - operating $9.2k - Назира $6k = **+$10.4k маржи**.

### Как улучшить экономику (priority actions)

1. **Снизить setup-время до 10h через автоматизацию визарда** → +$300/клиент year 1 → 30-40% лучше margin.
2. **Переговорить с Назирой — фикс комиссия $200 вместо 37.5%** → +$100/клиент year 1 → стабильно по tier'ам.
3. **Снизить support до 10 мин/мес через FAQ / self-service** (Release 2) → +$60/год.
4. **В апсейл-пакет (Release 2):** голосовые, виджет на сайт, premium-promt = +$10-20/мес upsell.

### Финализация — Фаза 5 (решение Алана 2026-04-20)

Алан сказал: «цено образование подумаем в финале, главное запомни, а лучше когда будет Фаза 5 сделаем карточку». То есть:

- **Сегодня (Фаза 2):** фиксируем **v1 draft** с реальными цифрами и принципом «Wappi/сервер/OpenRouter в базе как revenue».
- **Фаза 5 (Process setup + Trello):** создаётся карточка **«Финализация ценообразования»** в Backlog — принимаем решение по точным цифрам через party-mode с Winston / John / Mary / Victor.
- **До финализации:** Назира может продавать по **v3-формуле $800 + $40/мес**, но Алан знает, что это не окончательная цифра.

---

## Фаза 2 — статус и передача

**Закрыто в v1:**
- ✅ Реалити-чек экономики, 3 варианта (A/B/C/D), посчитаны.
- ✅ Получены real-data Ton Azure (17 дней, ~3 диалога/день, ~$1/мес на OpenRouter).
- ✅ Зафиксирован принцип «Wappi/сервер/OpenRouter в базе как revenue».
- ✅ Выбран кандидат — Business tier v3 ($800 + $40/мес, Wappi в базе).

**Отложено в Фазу 5 через Trello-карточку «Финализация pricing»:**
- [ ] Точные финальные цифры tier'ов (возможно $800/40, возможно $900/50).
- [ ] Решение по комиссии Назиры: 37.5% vs фикс.
- [ ] Решение по Starter (Micro) tier — вообще делаем или только Business.
- [ ] Решение по Pro tier — держим как exception или выкидываем.
- [ ] Party-mode дискуссия для валидации выбора.

**Blocks 6-8 Lean Canvas — заполнятся после финализации в Фазе 5.** Пока зафиксируем **черновик** с v3-номерами в appendix lean_canvas_v1.md для reference.

---

## Open questions → валидация в Фазе 2b (party-mode)

- [ ] Получить реальные цифры от Ton Azure (SQL запросы выше) → актуализировать гипотезы.
- [ ] Проверить текущие цены Haiku на OpenRouter (могли поменяться).
- [ ] Определить, включать ли Wappi.pro в нашу цену или клиент платит сам. (Алан в УЦП написал «всё включено» → **включаем в нашу цену**, тогда marginal cost +$25/клиент.)
- [ ] Meta Cloud API verification — сколько по факту сообщений/месяц попадает в Meta pricing (free 1000 инициатив/мес, дальше $0.005-0.01).
- [ ] Сколько часов Алана реально уходит на onboarding (сейчас оценил 20h, по Ton Azure может быть больше).
- [ ] Решить про **Pro tier $1500 setup** — это правда для 40-80 номеров или мы не берём таких клиентов? (Блок 2 Lean Canvas ограничил верх 40 номерами — согласовать).
- [ ] Назирина комиссия (37.5% от setup на Ton Azure) — это one-time или recurring % с подписки?
- [ ] Party-mode discussion: Winston / John / Mary / Victor vote по варианту.

---

## Следующие шаги

1. [ ] Отправить SQL-запросы Ton Azure Claude'у (или Алан сам выгружает).
2. [ ] Получить ответ, обновить таблицы «по данным».
3. [ ] Проверить OpenRouter цены Haiku (актуальные апрель 2026).
4. [ ] Провести party-mode с агентами для выбора варианта тарифа.
5. [ ] Финализировать v1, обновить Блоки 6-8 в Lean Canvas.
6. [ ] Начать Sprint 0 (tech debts) — не зависит от pricing.

---

## Block 6-8 Lean Canvas — предварительно после v1 pricing

(будет заполнено после выбора варианта)

**Блок 6 — Revenue Streams:**
- Setup fee (one-time) — 60-70% revenue год 1
- Monthly subscription — 30-40% год 1, 100% год 2+
- Upsell: доп интеграции, video/фото-генерация, голосовые сообщения, SMS
- Future: Casino 🎲 (комиссия за брони через Distribution API с Exely, когда будет) = up to 3% от каждой брони

**Блок 7 — Cost Structure:**
- OpenRouter API (~$0.50-3/отель/мес по tier)
- Wappi.pro или Meta Cloud (~$25/отель/мес если Wappi)
- VPS Contabo (~$12/мес total)
- Human: Алан (setup), Назира (sales 37.5%), Emir (frontend dev part-time)
- Support time

**Блок 8 — Key Metrics:**
- Активные отели
- MRR / ARR
- Churn rate (month/year)
- CAC (cost of acquisition)
- LTV (ltv = годовая выручка × average years)
- Retention month 1 / month 3 / month 6
- Операционные: сообщений в бот / день, % автоматизации (забрал бот vs передал менеджеру), % конверсии (лид → бронь)
