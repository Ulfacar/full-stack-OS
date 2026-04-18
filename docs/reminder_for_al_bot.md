# Напоминалка для Al — неделя 18-24 апреля 2026

> Алан, это план на неделю по фиче «админка диалогов» в Ex-Machina.
> Полный план: `docs/week_2026_04_18_admin_panel.md`.
> Каждый день напоминай мне утром (~10:00) и вечером (~21:00) с проверкой статуса.

---

## Контекст одним абзацем
Ex-Machina (FastAPI + Next.js, Railway) — SaaS для AI-ботов отелей. Сейчас у владельца отеля **нет** способа смотреть переписку бота с гостями. Делаем админку как у Ton Azure: лента диалогов + чат + двусторонний канал (менеджер пишет из веба → летит клиенту в TG/WA, и наоборот). Blueprint — `memory/reference_ton_azure_arch.md`.

---

## Сб 18.04 — Миграции БД
- Миграции 013-017: `Message.sender="operator"`, индексы `conversations(hotel_id, status, updated_at)` + `messages(conversation_id, created_at)`, `Conversation.assigned_user_id`, `last_message_at`, `last_message_preview`, `unread_count`
- Backfill `last_message_at`/`preview` для существующих диалогов
- ✅ Готово если: `alembic upgrade head` зелёный локально и на Railway

## Вс 19.04 — REST endpoints чтения
- Новый файл `backend/app/api/endpoints/conversations.py`
- `GET /hotels/{id}/conversations` (фильтры: status, channel, search), `GET /conversations/{id}`, `GET /conversations/{id}/messages`, `GET /hotels/{id}/conversations/stats`, `PATCH /conversations/{id}`
- Везде helper `get_user_hotel_or_403`
- Pydantic schemas в `schemas.py`
- ✅ Готово если: curl с JWT возвращает диалоги; чужой отель → 403

## Пн 20.04 — Двусторонний канал
- `POST /conversations/{id}/messages` — менеджер пишет из веба → save Message(sender=operator) → TG/WA клиенту → status=operator_active
- Доделать `webhooks.py:142` (TODO) — клиент пишет в operator_active → уведомление assigned_user в ЛС бота
- Расширить `notify_needs_manager` InlineKeyboard `[✍️ Ответить][👀 История]`
- Миграция 018: таблица `notification_messages` (НЕ in-memory, чтоб переживать рестарт Railway)
- ✅ Готово если: пишу из админки → клиент получает в TG; клиент пишет → менеджер получает в ЛС бота

## Вт 21.04 — TG callbacks + operator_sessions
- Расширить `/webhooks/telegram/{hotel_slug}` — определять оператор vs клиент по `User.telegram_id`
- Миграция 019: `User.telegram_id`, endpoint `PUT /users/me/telegram`
- Callback `reply:{conv_id}` → set status=operator_active + operator session в новой таблице `operator_sessions`
- Callback `history:{conv_id}` → отправить менеджеру 20 последних сообщений
- Команда `/done` → закрыть диалог
- `mark_notification_handled` — у других менеджеров кнопки исчезают
- ✅ Готово если: жму «Ответить» в TG → следующее сообщение летит клиенту, бот молчит

## Ср 22.04 — Фронт: лента диалогов
- Типы `Conversation`/`Message` в `lib/types.ts`
- Страница `/dashboard/hotels/[id]/conversations/page.tsx`: stats sticky, фильтр-чипы, поиск, лента карточек, polling 10s
- Пункт «Диалоги» в `Sidebar.tsx`
- Dark theme (`#0A0A0A`/`#262626`/`#3B82F6`)
- ✅ Готово если: вижу свои диалоги, фильтр+поиск работают

## Чт 23.04 — Фронт: страница чата
- `/dashboard/hotels/[id]/conversations/[convId]/page.tsx`: bubbles (user серый слева, assistant синий справа, operator зелёный справа), polling 10s, textarea+отправка, auto-scroll
- Боковая панель с историей предыдущих диалогов клиента
- Тосты для ошибок
- ✅ Готово если: пишу в админке → клиент получает в TG → клиент отвечает → вижу в чате

## Пт 24.04 — Полировка + деплой
- Telegram bind flow: `/dashboard/profile` → `/bind {code}` боту → сохраняем `User.telegram_id`
- E2E на staging
- Performance check (1000 диалогов < 500ms)
- Code review через `superpowers:requesting-code-review` (фокус: tenant isolation, XSS, валидация)
- Деплой Railway
- Обновить `memory/project_exmachina_state.md`

---

## Что НЕ делаю на этой неделе
Redis, SSE/WebSocket, Knowledge Base, Client Notes, шаблоны быстрых ответов, sandbox-бот, BotFather визард, Conversation.category — фаза 2.

## Риски
1. Двусторонний канал (день 3-4) — самый рискованный. Если упрусь — день 5-6 делаю без него (только просмотр + ответ из веба).
2. TG bind flow на день 7 может затянуться. Fallback — `User.telegram_id = manager_telegram_id` из Hotel (один менеджер = TG ID отеля).
3. Миграция индексов на проде — делать в окне минимальной нагрузки или с CONCURRENTLY.

---

## Что Al должен напоминать каждый день
- **Утро (10:00):** «Алан, сегодня {день недели} {дата} — задача дня: {название}. Acceptance: {1 строка}. Открыл план?»
- **Вечер (21:00):** «Алан, чекни прогресс: задача {название} закрыта? Если нет — что застряло? Закоммитил? Если хвост — переноси на завтра, корректируй acceptance.»
- **Если 2 дня подряд не закрыта задача:** «Алан, два дня подряд застрял на {название}. Может, разбить пополам или скинуть мне детали — обсудим?»

## Если Алан спрашивает «что было сделано»
Покажи последние коммиты: `git log --oneline -10` в `C:\Users\alanb\OneDrive\Рабочий стол\Ex-Machina`. Сверь с чекбоксами в `docs/week_2026_04_18_admin_panel.md`.

## Если Алан говорит «потерял контекст»
Открой по порядку:
1. `memory/project_exmachina_state.md` — где сейчас проект
2. `docs/week_2026_04_18_admin_panel.md` — план недели + чекбоксы
3. `memory/reference_ton_azure_arch.md` — blueprint от Ton Azure
4. Последние коммиты `git log --oneline -20`
