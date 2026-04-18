# Неделя 18-24 апреля 2026 — Админка диалогов Ex-Machina

> Цель: владелец отеля видит все диалоги бота с гостями и может отвечать через TG-бота.
> Blueprint: ответ Ton Azure Клауда (см. `memory/reference_ton_azure_arch.md`).
> Текущее состояние: `memory/project_exmachina_state.md`.

---

## День 1 — Сб 18 апреля
**Бэкенд: данные и индексы (фундамент)**

- [ ] 1.1 Миграция 013: `Message.sender = "operator"` в enum (сейчас только user/assistant/system)
- [ ] 1.2 Миграция 014: индексы `conversations(hotel_id, status, updated_at DESC)` и `messages(conversation_id, created_at)`
- [ ] 1.3 Миграция 015: `Conversation.assigned_user_id` (FK → users.id, nullable) — для трекинга кто из менеджеров взял диалог
- [ ] 1.4 Миграция 016: `Conversation.last_message_at` (denormalized, для сортировки ленты без JOIN на messages)
- [ ] 1.5 Миграция 017: `Conversation.last_message_preview` (varchar 200, denormalized) + `unread_count` для бейджа в ленте
- [ ] 1.6 Backfill миграция: заполнить `last_message_at`/`preview` для существующих диалогов

**Acceptance:** alembic upgrade head проходит локально и на Railway, существующие диалоги мигрированы без потерь.

---

## День 2 — Вс 19 апреля
**Бэкенд: REST endpoints для чтения диалогов**

Новый файл `backend/app/api/endpoints/conversations.py`:

- [ ] 2.1 `GET /hotels/{hotel_id}/conversations?status=&search=&channel=&limit=50&offset=0`
  - Фильтры: status (multi через `?status=active&status=needs_operator`), search по client.name/username (ILIKE), channel
  - Order by `last_message_at DESC`
  - Auth: hotel.owner_id == current_user.id
  - Response: `[{id, client: {id, name, username, channel}, status, channel, last_message_at, last_message_preview, unread_count, message_count}]`
- [ ] 2.2 `GET /hotels/{hotel_id}/conversations/stats` → `{today: {active, needs_operator, operator_active, completed}, total: {...}}`
- [ ] 2.3 `GET /conversations/{id}` → один диалог с полным client и last_5_messages для preview
- [ ] 2.4 `GET /conversations/{id}/messages?limit=100&offset=0` → история (ASC по created_at), включая `sender` (user/assistant/operator)
- [ ] 2.5 `PATCH /conversations/{id}` → {status?, assigned_user_id?} (для закрытия/переназначения вручную)
- [ ] 2.6 Везде: проверка `hotel.owner_id == current_user.id`. Создать helper `get_user_hotel_or_403(hotel_id, user, db)`.

**Pydantic schemas** в `backend/app/api/schemas.py`:
- [ ] 2.7 `ConversationListItem`, `ConversationDetail`, `MessageItem`, `ConversationStats`

**Acceptance:** curl с JWT возвращает диалоги Ton Azure-style ленты, чужой отель → 403.

---

## День 3 — Пн 20 апреля
**Бэкенд: двусторонний канал (менеджер ↔ клиент через TG)**

- [ ] 3.1 `POST /conversations/{id}/messages` body `{text}` — менеджер пишет клиенту через веб-админку
  - Save Message(sender=operator, content=text)
  - Set status=operator_active, assigned_user_id=current_user.id
  - Отправить клиенту в его канал: TG → bot.send_message, WA → wappi/meta
  - Update last_message_at/preview/unread_count=0
- [ ] 3.2 Доделать `webhooks.py:142` (сейчас TODO). Когда `conversation.status == operator_active`:
  - Save Message(sender=user)
  - Update last_message_at/preview, unread_count += 1
  - Отправить уведомление assigned_user в ЛС бота: `💬 Новое от гостя (диалог #N): {text}` + кнопка `[✍️ Ответить]`
- [ ] 3.3 Расширить `notification_service.notify_needs_manager`:
  - Добавить InlineKeyboard `[✍️ Ответить][👀 История]` в уведомлении
  - Сохранить `(chat_id, message_id)` в БД (новая таблица `notification_messages` с FK на conversation) — НЕ in-memory, чтоб переживать рестарт Railway
- [ ] 3.4 Миграция 018: `notification_messages(id, conversation_id, manager_telegram_id, message_id, created_at, handled_at)` + индекс по conversation_id

**Acceptance:** менеджер пишет из веб-админки → клиент получает в TG; клиент пишет → менеджер получает в ЛС бота.

---

## День 4 — Вт 21 апреля
**Бэкенд: TG callback handlers + handle_operator_message**

Новый сервис `backend/app/services/operator_handler.py`:

- [ ] 4.1 Endpoint `POST /webhooks/telegram/{hotel_slug}` расширить — определять источник: клиент или менеджер
  - Если `from.id` совпадает с любым `users.telegram_id` владельца этого отеля → ветка оператора
  - Иначе → текущая логика клиента
- [ ] 4.2 Добавить поле `User.telegram_id` (миграция 019) + endpoint `PUT /users/me/telegram` для привязки
- [ ] 4.3 Callback `reply:{conv_id}` (через `callback_query` в TG update):
  - Set conversation.status = operator_active, assigned_user_id = manager.id
  - Сохранить `operator_reply_state` в новой таблице (ИЛИ Redis, если успеваем — иначе таблица `operator_sessions(user_id, active_conversation_id, updated_at)`)
  - Edit notification message → "✍️ Вы отвечаете на диалог #N"
- [ ] 4.4 Callback `history:{conv_id}` → отправить менеджеру последние 20 сообщений диалога
- [ ] 4.5 Когда менеджер пишет боту в ЛС, и у него есть active operator session → переслать клиенту + save Message(sender=operator)
- [ ] 4.6 Команда `/done` → status=closed, clear operator session
- [ ] 4.7 `mark_notification_handled(conversation_id)` — редактировать остальные уведомления у других менеджеров → "✅ Обработано {имя}"

**Acceptance:** менеджер жмёт "Ответить" в TG → бот задаёт режим → следующее сообщение менеджера летит клиенту, бот молчит.

---

## День 5 — Ср 22 апреля
**Фронт: страница ленты диалогов**

- [ ] 5.1 Добавить типы в `frontend-platform/lib/types.ts`: `Conversation`, `Message`, `ConversationStats`
- [ ] 5.2 Расширить `lib/api.ts` хелперами: `getConversations(hotelId, filters)`, `getMessages(convId)`, `sendOperatorMessage(convId, text)`
- [ ] 5.3 Новая страница `app/dashboard/hotels/[id]/conversations/page.tsx`:
  - Sticky-карточка stats сверху (активные/нужен оператор/закрытые сегодня)
  - Фильтр-чипы по статусу + поиск по имени гостя
  - Лента: Card с avatar (placeholder), name/username, channel-badge (TG/WA), preview последнего сообщения, время, unread badge
  - React Query: `useQuery` с polling 10 сек (`refetchInterval: 10000`)
  - Стилизация по dark theme (`#0A0A0A`/`#262626`/`#3B82F6`)
- [ ] 5.4 Добавить пункт "Диалоги" в `Sidebar.tsx` (внутри dashboard hotels — линк на `/dashboard/hotels/[id]/conversations`)

**Acceptance:** владелец видит ленту своих диалогов, фильтр работает, поиск работает, реактивно обновляется.

---

## День 6 — Чт 23 апреля
**Фронт: страница чата + отправка сообщений**

- [ ] 6.1 `app/dashboard/hotels/[id]/conversations/[convId]/page.tsx`:
  - Шапка: client name, channel, status-badge, кнопки [Закрыть диалог] [Назначить себе]
  - Тело: список сообщений (bubble-стиль). user — слева серый, assistant — справа синий, operator — справа зелёный с пометкой "Менеджер: {имя}"
  - Polling сообщений 10 сек
  - Footer: textarea + кнопка "Отправить" (POST /conversations/{id}/messages) — disabled если status=closed
  - Auto-scroll к последнему сообщению при новых
- [ ] 6.2 Боковая панель с историей предыдущих диалогов этого клиента (collapsable)
- [ ] 6.3 Empty state: "Выбери диалог" если нет convId
- [ ] 6.4 Тосты для ошибок отправки (network fail / 403 / 500)

**Acceptance:** менеджер пишет в админке → видит ответ клиента в TG → клиент видит ответ менеджера в TG.

---

## День 7 — Пт 24 апреля
**Полировка + e2e тесты + деплой**

- [ ] 7.1 Telegram bind flow: страница `/dashboard/profile` → инструкция "напиши боту /bind {code}" → код в localStorage 5 мин → бот сохраняет `User.telegram_id`
- [ ] 7.2 E2E проверка на staging: создать тестовый Hotel, привязать TG bot, написать гостем → ответить менеджером из админки → ответить менеджером из TG → убедиться что всё долетает в правильном порядке
- [ ] 7.3 Performance check: лента с 1000 диалогов — должна открываться < 500ms (если нет — добавить limit/offset на фронте)
- [ ] 7.4 Code review (использовать `superpowers:requesting-code-review` агента) на критичные части: tenant isolation в conversations endpoints, отсутствие XSS в выводе сообщений, валидация text length при отправке
- [ ] 7.5 Деплой на Railway, проверка миграций
- [ ] 7.6 Обновить `memory/project_exmachina_state.md` — переместить пункты из "не работает" в "работает"
- [ ] 7.7 README/CHANGELOG: одна заметка про новую фичу

**Acceptance:** деплой на проде, Бектур (Ton Azure владелец) теоретически может зарегистрироваться в Ex-Machina и получить такую же админку.

---

## Что СОЗНАТЕЛЬНО НЕ делаем на этой неделе

- ❌ Redis (используем Postgres-таблицу `operator_sessions` вместо in-memory или Redis — миграция на Redis отдельной задачей в фазу 2)
- ❌ SSE/WebSocket — polling 10s на старте достаточно (даже у Ton Azure так работает)
- ❌ Knowledge Base + Client Notes — фаза 2
- ❌ Шаблоны быстрых ответов — фаза 2
- ❌ Песочница `@exmachina_sandbox_bot` — отдельная задача после
- ❌ BotFather визард с гифкой — отдельная задача после
- ❌ Conversation.category — пока без него, добавим когда будет UX-запрос

## Риски

1. **TG bind flow на день 7 может затянуться** — если так, переносим на следующую неделю, на неделе используем `User.telegram_id = manager_telegram_id` из Hotel (т.е. один менеджер = TG ID отеля).
2. **Двусторонний канал на день 3-4 самый рискованный.** Если упрёмся — день 5-6 делаем без него (только просмотр + ответ ИЗ ВЕБА; ответ через TG — отдельной задачей).
3. **Миграция 014 (индексы) на проде** — может занять минуты на больших таблицах. Делать в окне минимальной нагрузки или с CONCURRENTLY.

## Daily ритуал

- В начале дня: `git pull`, `alembic upgrade head`, проверить что Railway деплой зелёный
- В конце дня: коммит с префиксом `feat:`/`fix:`/`refactor:`, пометить чекбоксы в этом файле
- Если день не закрыт — переносим хвост на следующий, корректируем acceptance
