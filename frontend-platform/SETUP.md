# Инструкция по установке и запуску фронтенда

## Что уже создано:

✅ **Базовая структура Next.js 14**
- package.json с зависимостями
- TypeScript конфигурация
- Tailwind CSS настроен
- Глобальные стили

✅ **API клиент и типы**
- `lib/api.ts` - Axios клиент с interceptors
- `lib/types.ts` - TypeScript интерфейсы
- `lib/utils.ts` - Утилиты
- `lib/promptGenerator.ts` - Генератор промптов (ключевой файл!)

✅ **Конфигурации**
- `.env.local` - переменные окружения
- `next.config.js`
- `tailwind.config.ts`
- `tsconfig.json`

## Шаги для запуска:

### 1. Установите зависимости

```bash
cd frontend-platform
npm install
```

Если npm install выдает ошибки, установите недостающие пакеты:

```bash
npm install tailwindcss-animate
```

### 2. Создайте недостающие файлы

Нужно создать:
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Главная страница
- Базовые UI компоненты в `components/ui/`
- Страницы приложения в `app/`

### 3. Запустите dev сервер

```bash
npm run dev
```

## Следующие шаги разработки:

### Этап 1: UI компоненты (shadcn/ui style)
Создайте в `components/ui/`:
- `button.tsx`
- `input.tsx`
- `card.tsx`
- `label.tsx`
- `textarea.tsx`
- `select.tsx`
- `radio-group.tsx`

### Этап 2: Layout и авторизация
- `app/layout.tsx` - root layout с React Query
- `app/(auth)/login/page.tsx` - страница логина
- `app/(auth)/register/page.tsx` - страница регистрации

### Этап 3: Дашборд
- `app/dashboard/page.tsx` - список отелей
- `app/dashboard/layout.tsx` - layout с sidebar

### Этап 4: Мастер создания отеля (самое важное!)
- `app/hotels/new/page.tsx` - мастер создания
- `components/hotel/HotelWizard.tsx` - основной компонент
- `components/hotel/steps/Step1.tsx` - Основная информация
- `components/hotel/steps/Step2.tsx` - Номера и цены
- `components/hotel/steps/Step3.tsx` - Правила
- `components/hotel/steps/Step4.tsx` - Настройка AI (с генератором промптов!)
- `components/hotel/steps/Step5.tsx` - Подключение каналов

### Этап 5: Bot Preview
- `components/hotel/BotPreview.tsx` - Live preview бота

## Ключевой компонент: Генератор промптов

Файл `lib/promptGenerator.ts` содержит функцию `generatePrompt()` которая:

1. Берёт данные из формы (название отеля, номера, правила...)
2. Подставляет их в шаблон
3. Возвращает готовый SYSTEM_PROMPT для OpenRouter

**Использование:**

```typescript
import { generatePrompt } from '@/lib/promptGenerator';

const formData = {
  name: 'Radisson Bishkek',
  address: 'ул. Абдрахманова 191',
  phone: '+996 312 123456',
  rooms: [
    { name: 'Twin/Double', capacity: 2, price: 8000 },
  ],
  rules: {
    checkin: '14:00',
    checkout: '12:00',
  },
  communicationStyle: 'friendly',
  languages: ['ru', 'en'],
  aiModel: 'deepseek/deepseek-chat',
};

const prompt = generatePrompt(formData);
// Теперь prompt содержит полный SYSTEM_PROMPT для AI
```

## Архитектура приложения

```
Пользователь
    ↓
Заполняет форму создания отеля (5 шагов)
    ↓
generatePrompt(formData) → SYSTEM_PROMPT
    ↓
POST /api/hotels {name, prompt, telegram_token...}
    ↓
Backend создаёт запись Hotel в БД
    ↓
Telegram бот использует этот prompt для ответов
```

## Тестирование генератора промптов

Можете протестировать в Node.js:

```bash
npm install -D tsx
npx tsx -e "
import { generatePrompt } from './lib/promptGenerator.ts';
const prompt = generatePrompt({
  name: 'Test Hotel',
  phone: '+996',
  rooms: [{name: 'Room', capacity: 2, price: 5000}],
  rules: {checkin: '14:00', checkout: '12:00'},
  communicationStyle: 'friendly',
  languages: ['ru'],
  aiModel: 'deepseek/deepseek-chat'
});
console.log(prompt);
"
```

## Что дальше?

1. Установите зависимости: `npm install`
2. Создайте базовые UI компоненты
3. Создайте страницы приложения
4. Протестируйте мастер создания отеля
5. Подключите к бэкенду

Генератор промптов уже работает - это основа платформы! 🚀
