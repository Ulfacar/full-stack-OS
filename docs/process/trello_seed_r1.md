# Trello Seed — Ex-Machina Backlog v1

> **Статус:** Source of truth для первого заполнения Trello.
> **Источник:** `docs/strategy/user_story_map_v1.md` stories #1-37.
> **Парсится:** `scripts/seed_trello.py` (простой regex).
> **После первого `seed_trello.py` запуска** — ведём в Trello UI. Md файл остаётся как архив первичного дампа (refresh — только при больших переизмышлениях USM).

## Формат карточки (парсер опирается на него)

```
## [R1a|R1b|R1c|R2|R3] #NN Заголовок story
- **Size:** S|M|L
- **$:** HIGH|High|Med|Low
- **Sprint:** 0|1|N|-
- **Labels:** comma separated (🔧 TD, ✅ Partial, …)

### Why
одна-две фразы, со ссылкой на USM

### AC
- [ ] конкретный чекбокс
- [ ] ещё один

### Ref
USM #NN · Lean Canvas ссылка · …
```

---

# Sprint 0 — solo task, стартует параллельно Sprint 1

## [R1a] #29 fix_prices + ensure_room_variants порт из Bot-Azure
- **Size:** S
- **$:** High
- **Sprint:** 0
- **Labels:** 🔧 TD

### Why
Без него первый диалог нового клиента ломается на арифметике (сложение/округление цен, варианты номеров). Task #7 Sprint 0 — блокер продажи любого клиента кроме Ton Azure.

### AC
- [ ] `fix_prices()` + `ensure_room_variants()` портированы в `backend/app/services/ai_service.py`
- [ ] Unit-тест `tests/test_fix_prices.py` покрывает edge-cases: цена 0, цена NULL, отсутствие variants, несовместимые единицы
- [ ] Первый диалог с тестовым hotel_id не выдаёт арифметических косяков (manual E2E)
- [ ] Коммит `feat(ai): port fix_prices/ensure_room_variants from Bot-Azure`

### Ref
USM #29 · Lean Canvas Task #7 P0 · Bot-Azure `fix_prices.py`

---

# Sprint 1 — инфра админки диалогов (планируется)

## [R1a] #17 Активация-гайд: отдельный номер + 7-14 дней прогрева + анти-бан чеклист
- **Size:** S
- **$:** High
- **Sprint:** 1
- **Labels:**

### Why
30-40% клиентов отваливаются между Buy и Run если не помочь с WA-настройкой. Анти-бан правила из переписки Алана с Wappi (2026-04-21): не более 5-10 msg/мин, прогретый номер, персонализация.

### AC
- [ ] `docs/guides/wa_onboarding.md` содержит: покупка номера, 7-14 дней прогрева, чеклист анти-бана (5 правил)
- [ ] FAQ «устройство НЕ обязано быть всегда включено — Wappi на сервере»
- [ ] Ссылка из визарда `/create-bot` шага «Подключите WhatsApp» → этот гайд
- [ ] Коммит `docs(guides): WA onboarding anti-ban checklist`

### Ref
USM #17 · `reference_wappi_pro.md` · переписка Алан с Wappi dev

---

## [R1a] #20 Поле «реквизиты оплаты» в визарде + в промпте (fail-loud backend)
- **Size:** M
- **$:** High
- **Sprint:** 1
- **Labels:** 🔧 TD

### Why
Сейчас `[РЕКВИЗИТЫ]` заглушка в системном промпте → первые диалоги новому клиенту ломаются. TD #2 из Task #7. UX-решение: optional + fail-loud.

### AC
- [ ] Визард `/create-bot` шаг «Оплата»: поля bank_details, phone_for_payment, iban (опциональные)
- [ ] `hotels` таблица: колонки `payment_details` JSONB nullable (миграция 014 или отдельная)
- [ ] `ai_service.generate_system_prompt` подставляет реквизиты если есть, иначе оставляет поле пустым
- [ ] `response_processor`: если в ответе бота есть подстрока «[РЕКВИЗИТЫ]» И поле пустое — НЕ отправлять, вместо этого триггернуть `notification_service.notify_owner("заполните реквизиты, бот не может ответить клиенту")`
- [ ] UI визард: «вы можете заполнить позже, но бот будет молчать при вопросах про оплату»
- [ ] Коммит `feat(sales): payment details field with fail-loud prompt safeguard`

### Ref
USM #20 · Lean Canvas Task #7 TD #2

---

## [R1a] #26 Двусторонний канал manager↔client (TG → WA)
- **Size:** L
- **$:** High
- **Sprint:** 1-2 (миграции 014-018 → operator model → handlers)
- **Labels:**

### Why
Блокер продажи: менеджер должен отвечать клиенту в WA из TG-личного бота. Сейчас `webhooks.py:142` буквально `# TODO: forward to manager's Telegram`.

### AC
- [ ] Миграция 014-018: `Message.sender` enum (operator), `operator_reply_state` (Redis или БД), indexes, `Conversation.assigned_user_id`
- [ ] `notification_service.notify_needs_manager` отправляет inline-клавиатуру `[✍️ Ответить][👀 История]`
- [ ] Handler `handle_operator_message` — когда менеджер пишет боту → летит клиенту в WA (Wappi/Meta)
- [ ] State map: «какой оператор какому клиенту отвечает» — Redis с TTL 15 мин
- [ ] E2E: менеджер получает уведомление → нажимает «Ответить» → пишет текст → клиент получает WA-сообщение → в базе Message с sender=operator
- [ ] Коммиты: `feat(tg): operator reply state`, `feat(webhooks): two-way manager channel`, миграции в отдельных

### Ref
USM #26 · `project_exmachina_state.md` раздел «Что НЕ работает» · `reference_ton_azure_arch.md`

---

## [R1b] #24 Категоризация диалога (GPT-классификация темы)
- **Size:** M
- **$:** Med
- **Sprint:** 1
- **Labels:**

### Why
Фундамент под #33 ROI-отчёт: считать только booking-диалоги. Украдено из Ton Azure admin (Бронирование/Общий/Номера). Блокирует #33.

### AC
- [ ] Миграция: `Conversation.category` enum (booking, general, rooms, service) nullable
- [ ] `ai_service.classify_dialog(messages)` — вызов к дешёвой модели (haiku/gpt-mini) для классификации, результат в category
- [ ] Вызов из `response_processor` после закрытия/followup диалога
- [ ] Фильтр в админке `/conversations?category=booking`
- [ ] Коммит `feat(ai): dialog category classifier`

### Ref
USM #24 · Ton Azure Playwright разведка 2026-04-21

---

## [R1a] #10 preview-chat QA pass
- **Size:** S
- **$:** High
- **Sprint:** 1
- **Labels:** ✅ Partial

### Why
Функция `preview-chat/simulate` уже реализована (`preview_chat.py`), но не было явной QA-проверки после последних изменений системного промпта. Критичный sales-инструмент.

### AC
- [ ] Playwright-тест: логин как Назира → `/create-bot` визард-демо → preview-chat → 5 типичных вопросов клиента (бронь, трансфер, еда, цена, отмена)
- [ ] Screenshot в `docs/retros/` для sprint review
- [ ] Если баги — отдельная карточка «fix preview-chat QA», не в этой story

### Ref
USM #10

---

# Sprint 2-3 — продуктовая неделя (tentative)

## [R1a] #27 Админка `/dashboard/hotels/[id]/conversations`
- **Size:** L
- **$:** High
- **Sprint:** 2
- **Labels:**

### Why
Без визуальной ленты диалогов менеджер не может работать. UX украден из Ton Azure (Playwright разведка 2026-04-21).

### AC
- [ ] `GET /api/conversations?hotel_id=X&category=&status=&limit=&offset=` — список с last_message_preview, unread_count, category, status
- [ ] `GET /api/conversations/{id}` — один + клиент-карточка
- [ ] `GET /api/conversations/{id}/messages` — пагинированная история
- [ ] Типы `Conversation`, `Message` в `frontend-platform/lib/types.ts`
- [ ] UI страница с фильтрами (Все/Нужен менеджер/В процессе/Бот справился/Менеджер отвечает/Закрытые) и поиском по имени
- [ ] ChatPage: лента сообщений + sidebar клиента + кнопки «Перехватить», «Подтвердить бронь», «Закрыть», «Обучить»
- [ ] Polling или SSE (R1 — polling 5s, SSE в R2)

### Ref
USM #27 · Ton Azure admin паттерны · blocker для #25, #31

---

## [R1a] #25 Кнопка «Подтвердить бронь + $ сумма» в админке
- **Size:** M
- **$:** High
- **Sprint:** 2
- **Labels:**

### Why
Raw data для #33 ROI-отчёта. Менеджер ручно вводит сумму брони при подтверждении. В R2 заменится Exely auto-confirm (#37).

### AC
- [ ] `POST /api/conversations/{id}/confirm-booking` — принимает `{amount_usd, nights, notes}`
- [ ] Миграция: таблица `confirmed_bookings` (conversation_id, amount_usd, nights, confirmed_at, confirmed_by_user_id)
- [ ] UI кнопка в ChatPage — модалка «Сумма брони $, ночей, заметки»
- [ ] Ссылка на эти данные из #33 отчёта
- [ ] Коммит `feat(conversations): confirm booking with amount`

### Ref
USM #25 · Ton Azure паттерн «Подтвердить бронь»

---

## [R1a] #9 Демо-бот @exmachina_sandbox_bot
- **Size:** M
- **$:** High
- **Sprint:** 2
- **Labels:**

### Why
Продажный инструмент для Назиры — показывать на встрече с владельцем за 2 минуты, без «давайте заведём вам аккаунт». Fake-hotel record с демо-промптом.

### AC
- [ ] Hotel SANDBOX в БД (slug=sandbox, owner_id=null или system)
- [ ] Новый TG-бот `@exmachina_sandbox_bot`, токен в env, привязан к Hotel SANDBOX через webhook
- [ ] Промпт настроен «вы AI-менеджер отеля "Горный Воздух" в Иссык-Куле» — заранее заполненный показательный кейс
- [ ] Reset endpoint: `POST /sandbox/reset` — чистит историю диалогов в Hotel SANDBOX (для чистого показа на следующей встрече)
- [ ] Инструкция для Назиры: `docs/guides/sales_demo.md` — как за 2 минуты показать
- [ ] Коммит `feat(demo): sandbox bot for Nazira sales`

### Ref
USM #9 · gated MVP из `feedback_workflow_ex_machina.md`

---

## [R1a] #33 Monthly ROI report
- **Size:** L
- **$:** HIGH
- **Sprint:** 3
- **Labels:**

### Why
⭐ Anti-churn core. Без него клиент churn'ит на 3-й месяц, потому что не видит ценности $40 подписки. Формула: `(N × avg$) / month_fee = XX× ROI`.

### AC
- [ ] Миграция: `hotels.avg_booking_price_usd` (заполняется в визарде #20 или default по tier)
- [ ] `GET /api/reports/monthly?hotel_id=X&month=YYYY-MM` → `{total_dialogs, booking_category_count, confirmed_bookings_count, saved_revenue_usd, subscription_fee, roi_x}`
- [ ] UI страница `/dashboard/hotels/[id]/reports` — карточки с цифрами + CSV-экспорт
- [ ] Email-рассылка 1-го числа каждого месяца с PDF-отчётом (опционально R1, можно в R1c)
- [ ] E2E: для Ton Azure за апрель 2026 отчёт показывает реальные цифры
- [ ] Коммит `feat(reports): monthly ROI for owners`

### Ref
USM #33 · инсайт #2 refounding «деньги-first» · блок 8 Lean Canvas Key Metrics

---

# Sprint 4+ — Sales funnel (R1b)

## [R1b] #5 Сравнительная таблица «Ex-Machina vs NURAI vs делаем сами»
- **Size:** S
- **$:** High
- **Sprint:** 4
- **Labels:**

### Why
Закрывает Evaluate→Trial. Владельцы сравнивают нас с NURAI и «наймём программиста». Таблица убирает «мы посоветуемся» на 3 дня.

### AC
- [ ] Страница `/compare` с 3 колонками (Ex-Machina / NURAI / in-house)
- [ ] Сравнение по: setup time, PMS интеграции, WA+TG, KG-местность, цена, Ton Azure кейс
- [ ] SEO-title «Сравнить AI-бота для отеля в КР»
- [ ] Линк из лендинга (#1) в hero «Смотреть сравнение»

### Ref
USM #5 · Competitor Intel 5 gap'ов

---

## [R1b] #6 Публичная страница Ton Azure case-study
- **Size:** S
- **$:** High
- **Sprint:** 4
- **Labels:**

### Why
Социальное доказательство. 58 диалогов, 82% эффективность, 49 уникальных клиентов — живой актив.

### AC
- [ ] Страница `/cases/ton-azure` с цифрами (из Playwright разведки 2026-04-21)
- [ ] 2-3 примера реальных диалогов (с разрешения Бектура, имена анонимизировать)
- [ ] Quote от Бектура о результатах
- [ ] Фото отеля

### Ref
USM #6

---

## [R1b] #8 ROI-калькулятор на лендинге
- **Size:** M
- **$:** High
- **Sprint:** 4
- **Labels:**

### Why
Снимает возражение цены до разговора с Назирой. «У меня 20 номеров, сколько окупится?» → сразу видит цифру.

### AC
- [ ] Виджет на лендинге: input rooms, avg_booking_price, current night_missed_rate → output `savings/month, ROI_x`
- [ ] Запись всех вводов в analytics (leads funnel metric)
- [ ] CTA «Заказать настройку» → переходит на визард (/create-bot visible after invite)

### Ref
USM #8

---

## [R1b] #16 После-оплаты WA «next steps»
- **Size:** S
- **$:** High
- **Sprint:** 3
- **Labels:**

### Why
Защищает от lost-activation. Клиент оплатил → тишина 3 дня → забыл про нас. Автоматическое WA через 15 мин после оплаты.

### AC
- [ ] Триггер после `Billing.status=paid` → отправка WA-сообщения owner_phone через Wappi
- [ ] Шаблон: «Спасибо за оплату! Следующий шаг: заполните реквизиты в визарде (ссылка). Если нужна помощь — пишите Назире»
- [ ] Logging в БД

### Ref
USM #16

---

## [R1b] #22 Система ролей менеджеров 2-4 на отель
- **Size:** M
- **$:** Med
- **Sprint:** 3
- **Labels:** 🔧 TD

### Why
TD #5 из Task #7. Сейчас только один User с role=admin/sales, без привязки к конкретному hotel_id. Нужна модель `Operator` или membership-таблица.

### AC
- [ ] Миграция: `hotel_operators` (hotel_id, user_id, role: owner/manager/reader, PRIMARY KEY (hotel_id, user_id))
- [ ] Endpoints `POST /hotels/{id}/operators` (invite), `DELETE` (remove), `GET` (list)
- [ ] UI страница `/dashboard/hotels/[id]/team`
- [ ] `get_current_user_for_hotel(hotel_id)` dependency — проверяет membership
- [ ] В `#26 двусторонний канал` — assignment идёт на конкретного operator'а

### Ref
USM #22 · Lean Canvas Task #7 TD #5

---

# R1c — Could (backlog, берём если остаётся время)

## [R1c] #1 Лендинг «Ex-Machina для мини-отелей КР»
- **Size:** M · **$:** Med · **Sprint:** - · **Labels:**

### Why
Trust-hygiene. Сейчас у нас только `exmachina.up.railway.app` без main marketing-page.

### AC
- [ ] Hero «AI-менеджер 24/7 для мини-отелей КР», sub «окупается с первой сохранённой брони в сезон»
- [ ] Блоки: Problem / Solution / Case / Pricing / CTA
- [ ] Nameplace прочитывается на mobile
- [ ] SEO + OpenGraph

### Ref
USM #1 · Lean Canvas УЦП

---

## [R1c] #7 FAQ Exely / Altegio
- **Size:** S · **$:** Med · **Sprint:** - · **Labels:**

### Why
Закрывает возражение «у меня Exely, вы дружите?» Gap vs NURAI general-AI.

### AC
- [ ] Блок FAQ на лендинге: 5-6 вопросов про PMS-интеграции
- [ ] Отдельная страница `/integrations` со статусом «в разработке — июнь 2026»

### Ref
USM #7

---

## [R1c] #12 Визард «за 10 минут» — доточка
- **Size:** S · **$:** Med · **Sprint:** - · **Labels:** ✅ Partial

### Why
Базовая версия есть в `/create-bot`, но UX-шероховатости (длинный текст, неочевидные кнопки).

### AC
- [ ] Progressbar по шагам
- [ ] Tooltip'ы на неочевидных полях
- [ ] Экран «Поздравляем! Ваш бот настроен» с next-steps
- [ ] A/B: A старая версия, B новая (если успеем)

### Ref
USM #12

---

## [R1c] #13 PDF-инвойс из админки
- **Size:** S · **$:** Med · **Sprint:** - · **Labels:**

### Why
Назира сейчас клепает счета в Word — неконсистентно. Унифицировать.

### AC
- [ ] `GET /api/billing/{id}/invoice.pdf` — генерация через reportlab или weasyprint
- [ ] Кнопка «Скачать счёт» в sales admin
- [ ] Шаблон с логотипом Ex-Machina, реквизитами, позицией (setup + месячная подписка)

### Ref
USM #13

---

## [R1c] #19 Шаг визарда «BotFather с гифкой»
- **Size:** S · **$:** Med · **Sprint:** - · **Labels:**

### Why
Сейчас владельцу неясно как создать TG-бот. Гифка 30 сек = минус 1 support-звонок.

### AC
- [ ] Записать гифку (OBS → gif) 30-40 сек
- [ ] Встроить в шаг визарда «TG-бот»
- [ ] Инструкция рядом шагом: «BotFather → /newbot → скопируйте токен → вставьте сюда»

### Ref
USM #19

---

## [R1c] #21 Тумблер «есть PMS?» в визарде → ветка промпта
- **Size:** S · **$:** Med · **Sprint:** - · **Labels:** 🔧 TD

### Why
TD #4 из Task #7. Разные промпты для отелей с Exely/Altegio vs без PMS (Google Sheets).

### AC
- [ ] Поле `pms_kind` в Hotel (enum: none, exely, altegio, shelter, custom)
- [ ] Тумблер в визарде + выбор из списка
- [ ] `ai_service.generate_system_prompt` ветвится по pms_kind

### Ref
USM #21 · Lean Canvas Task #7 TD #4

---

## [R1c] #23 Onboarding-чек «первое сообщение доставлено»
- **Size:** S · **$:** Med · **Sprint:** - · **Labels:**

### Why
Activation-completion signal. Когда первое реальное сообщение клиента прошло через бота — email владельцу «поздравляем, ваш бот в строю».

### AC
- [ ] Event `first_message_received` в analytics
- [ ] Триггер → notification_service.notify_owner по email + WA
- [ ] UI badge «Активирован» в admin списке hotels

### Ref
USM #23

---

## [R1c] #28 UI Promote / Rollback staging-промпта
- **Size:** S · **$:** Med · **Sprint:** - · **Labels:**

### Why
Endpoints `/hotels/{id}/promote-prompt` и `/rollback` готовы (`hotels.py:399-495`), UI нет. Владельцы правят промпт через Swagger — unsustainable.

### AC
- [ ] Кнопки «Применить» / «Откатить» в admin UI
- [ ] Confirm-dialog («Это заменит production-промпт, продолжить?»)
- [ ] History промптов (опционально)

### Ref
USM #28

---

## [R1c] #30 Google Sheets для no-PMS броней
- **Size:** M · **$:** Med · **Sprint:** - · **Labels:** 🔧 TD

### Why
TD #3 из Task #7. Для отелей без PMS — записывать confirmed_bookings в их Google Sheets (чтоб руки не трогали БД).

### AC
- [ ] Hotel settings: `google_sheet_id`, `google_sheet_credentials` (service account JSON)
- [ ] При `confirmed_bookings` insert → append row в Sheet (дата, клиент, сумма, ночей)
- [ ] Error handling: если Sheet недоступен — retry 3 раза, потом alert

### Ref
USM #30 · Lean Canvas Task #7 TD #3

---

## [R1c] #35 Auto-renewal reminder
- **Size:** S · **$:** Med · **Sprint:** - · **Labels:**

### Why
5 дней до счёта → WA + email «через 5 дней продление, проверьте реквизиты». Снижает churn по забывчивости.

### AC
- [ ] Cron job (Railway cron) — каждый день проверяет billing_period_end
- [ ] Отправка WA + email за 5 дней
- [ ] Flag `renewal_reminder_sent` чтоб не слать дважды

### Ref
USM #35

---

# R2 — Won't R1, переезжают при unlock Exely API июнь 2026 или по триггерам

## [R2] #2 SEO «AI бот отель Бишкек / Иссык-Куль»
- **Size:** M · **$:** Low · **Sprint:** - · **Labels:**

### Why
Long play. Нужны ≥3 кейса + ≥20 органических лендов в месяц до старта SEO-инвестиций.

### AC
- [ ] Keyword research (10 основных фраз)
- [ ] Blog-разделы с кейсами (при живых данных)
- [ ] Backlinks from partner sites

### Ref
USM #2

---

## [R2] #3 Реферальная программа владелец→владелец
- **Size:** M · **$:** High · **Sprint:** - · **Labels:**

### Why
Дешёвый acquisition. Первые 3-5 клиентов Назирыны — просим reward-ссылку своим друзьям-отельерам.

### AC
- [ ] Модель referral_codes (owner_id, code, discount_pct)
- [ ] UI «Пригласить друга — он получит $50 скидку, вы — $50 на счёт»
- [ ] Трекинг привлечённых сделок

### Ref
USM #3 · #36

---

## [R2] #4 Instagram-контент для мини-отелей
- **Size:** L · **$:** Low · **Sprint:** - · **Labels:**

### Why
Длинный play, 1 пост/нед от Назиры. Нужен content calendar.

### AC
- [ ] Открыть @exmachina.kg IG
- [ ] Content plan на 12 недель (1 пост/нед)
- [ ] First 3 posts готовы

### Ref
USM #4

---

## [R2] #11 Шарабельная ссылка «Отправь партнёру»
- **Size:** S · **$:** Med · **Sprint:** - · **Labels:**

### Why
Ускоряет Buy. Владелец хочет обсудить с бухгалтером/партнёром до подписи — даём read-only демо-ссылку.

### AC
- [ ] `GET /share/{token}` — read-only demo визарда + preview-chat
- [ ] Token expires 7 дней
- [ ] Analytics: кликнул / не кликнул

### Ref
USM #11

---

## [R2] #14 Kaspi / ElCard оплата
- **Size:** L · **$:** High · **Sprint:** - · **Labels:**

### Why
Local unfair advantage. Казахи + кыргызы не любят карточные платежи, используют Kaspi или ElCard.

### AC
- [ ] Kaspi Pay интеграция (через агрегатор или напрямую)
- [ ] ElCard — по запросу
- [ ] UI выбор способа оплаты в Buy step

### Ref
USM #14

---

## [R2] #15 Электронный акт / договор (PDF)
- **Size:** M · **$:** Med · **Sprint:** - · **Labels:**

### Why
Legal coverage. Сейчас Назира подписывает бумажные акты — не масштабируется.

### AC
- [ ] Шаблон договора-оферты
- [ ] DocuSign или аналог (или простой PDF-stamp)
- [ ] Хранение PDF в БД / S3

### Ref
USM #15

---

## [R2] #18 FAQ «Wappi на сервере, ваш телефон дома»
- **Size:** S · **$:** Med · **Sprint:** - · **Labels:**

### Why
Snaps fear. Владельцы боятся «я что, должен держать iPhone включённым?».

### AC
- [ ] FAQ-блок на лендинге или в гайде #17
- [ ] Цитата из переписки Алана с Wappi

### Ref
USM #18

---

## [R2] #31 Inline-клавиатура «нужен менеджер» для #26
- **Size:** S · **$:** Med · **Sprint:** - · **Labels:**

### Why
Реализация UX для #26 двусторонний канал. Inline-кнопки `[✍️ Ответить][👀 История]` в notify_needs_manager.

### AC
- [ ] Telegram inline-keyboard в notification_service
- [ ] Callback handlers
- [ ] State-aware (если уже в диалоге с клиентом → не показывать)

### Ref
USM #31 · часть #26

---

## [R2] #32 Шаблоны быстрых ответов
- **Size:** S · **$:** Low · **Sprint:** - · **Labels:**

### Why
Украдено из Ton Azure admin: Реквизиты / Подтверждена / Нет мест / Добраться / Условия отмены. Ускоряет работу менеджера.

### AC
- [ ] Hotel settings: JSON-массив quick_replies (title, text)
- [ ] Кнопки в ChatPage
- [ ] Клик → вставка текста в поле «Написать клиенту»

### Ref
USM #32 · Ton Azure паттерн

---

## [R2] #34 Upgrade tier prompt (15→40 номеров)
- **Size:** S · **$:** Med · **Sprint:** - · **Labels:**

### Why
Когда отель вырастает по токенам — триггерим «пора на средний tier». Upsell machine.

### AC
- [ ] Месячный чек: если ai_usage превысил threshold → email/WA владельцу
- [ ] Страница «upgrade tier» с сохранением скидки за лояльность

### Ref
USM #34

---

## [R2] #36 Реферальная программа (дубль #3 из другого угла)
- **Size:** S · **$:** Med · **Sprint:** - · **Labels:**

### Why
Та же суть что #3, но эта карточка — **UI в Renew activity** (после полугода используй промокод).

### AC
- [ ] UI «Вы уже с нами 6 месяцев — пригласите друга и получите месяц бесплатно»
- [ ] Автоматический trigger после X месяцев активности

### Ref
USM #36 · #3

---

## [R2] #37 Exely auto-confirm бронь
- **Size:** L · **$:** High · **Sprint:** - (июнь 2026) · **Labels:**

### Why
Когда Exely Distribution API откроется — заменяет ручную кнопку #25. Бот сам бронирует + отправляет ссылку оплаты.

### AC
- [ ] Exely API integration (auth, create booking, get payment link)
- [ ] Fallback: если API недоступен — ручной flow #25
- [ ] UI переключатель «auto-book» в hotel settings

### Ref
USM #37 · Lean Canvas Block 4 Release 2

---

# Конец дампа

**Итого:** 37 карточек (10 R1a must, 6 R1b should, 10 R1c could, 11 R2).

**Следующие действия:**
1. Запусти `python scripts/seed_trello.py` с `TRELLO_API_KEY` + `TRELLO_TOKEN`.
2. Скрипт создаст доску «Ex-Machina», колонки, labels, и разложит все 37 карточек.
3. Первый sprint planning в понедельник — берёшь из Sprint 0 (#29) + 3-5 из Backlog (приоритет R1a).
