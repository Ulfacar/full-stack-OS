# Frontend TODO для Эмира

## Репо: github.com/Ulfacar/Ex-Machina
## Фронт: /frontend-platform

## Что уже сделано (бэкенд + базовый фронт)
- Лендинг Ex-Machina (тёмный hero + мокап телефона)
- Визард: быстрый (3 шага) + полный (8 шагов)
- BotPreview с реальным AI
- Демо-страница /hotels/[id]/demo (мокап телефона)
- Dashboard с бюджет-барами
- Управление отелем: бюджет, статус, каналы (TG + wappi.pro + Meta API)
- Страница пользователей (создание продажников)
- Sidebar с ролями (admin видит всё, sales — только визард и отели)

## Что нужно доработать

### Дизайн
- [ ] Отполировать лендинг: анимации, micro-interactions, адаптив
- [ ] Привести dashboard к единому стилю с лендингом
- [ ] Мобильная версия визарда (продажник заполняет на телефоне!)
- [ ] Полный визард (FullWizard.tsx) — может потребовать UI улучшений

### Функционал
- [ ] Страница /dashboard/stats — проверить что графики работают
- [ ] Страница /dashboard/billing — проверить
- [ ] Login/Register — обновить брендинг на Ex-Machina
- [ ] Success page после создания — может не нужна, есть /demo

### Цветовая палитра
Смотри DESIGN_BRIEF.md — там всё: цвета, типографика, структура страниц.

### API endpoints (бэкенд готов)
- POST /hotels — создание (без TG token, status=demo)
- POST /hotels/{id}/configure-channels — подключение каналов
- GET /admin/hotels/ — список с бюджетами
- GET/PUT /admin/hotels/{id}/budget — управление бюджетом
- POST /admin/users/create-sales — создание продажника
- GET /admin/users/ — список пользователей
- POST /preview-chat — демо-чат (требует JWT)

### Важно
- Все API вызовы через lib/api.ts (JWT Bearer авторизация)
- promptGenerator.ts — генерирует промпт, синхронизирован с бэкендом
- Стили: Tailwind + shadcn-style компоненты в /components/ui/
