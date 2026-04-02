# Asystem Platform - Frontend

AI-ассистенты для гостиничного бизнеса. Платформа для создания и управления ботами.

## Установка

```bash
npm install
```

## Запуск

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## Структура проекта

```
frontend-platform/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Авторизация
│   ├── dashboard/         # Дашборд с отелями
│   ├── hotels/            # Создание и управление отелями
│   └── globals.css        # Глобальные стили
├── components/            # React компоненты
│   ├── hotel/            # Компоненты для отелей
│   ├── ui/               # Базовые UI компоненты
│   └── layout/           # Layout компоненты
├── lib/                  # Утилиты
│   ├── api.ts           # API клиент (axios)
│   ├── types.ts         # TypeScript типы
│   ├── promptGenerator.ts # Генератор промптов
│   └── utils.ts         # Вспомогательные функции
└── hooks/               # React hooks

## Ключевые технологии

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React Query** (управление состоянием API)
- **Axios** (HTTP клиент)

## Основные фичи

1. **Мастер создания отеля** - пошаговая форма (5 шагов)
2. **Генератор промптов** - автоматическая генерация system prompt
3. **Live Preview** - предпросмотр бота в реальном времени
4. **Дашборд** - управление всеми отелями
5. **Статистика** - аналитика по диалогам

## Переменные окружения

Создайте `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Разработка

- `npm run dev` - запуск dev сервера
- `npm run build` - production build
- `npm run start` - запуск production
- `npm run lint` - проверка кода
