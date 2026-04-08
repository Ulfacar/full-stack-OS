import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <header className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">ASystem</div>
          <Link href="/login" className="text-sm opacity-80 hover:opacity-100">
            Войти →
          </Link>
        </nav>
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            AI-бот для вашего отеля за 1 день
          </h1>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Бот отвечает гостям 24/7, собирает заявки на бронирование и передаёт менеджеру.
            Telegram + WhatsApp. На 3 языках.
          </p>
          <Link
            href="/create-bot"
            className="inline-block bg-white text-blue-700 font-semibold px-8 py-4 rounded-xl text-lg hover:bg-blue-50 transition"
          >
            Создать бота для вашего отеля →
          </Link>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Что умеет бот</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '🤖', title: '24/7 ответы', desc: 'Бот отвечает мгновенно, даже ночью. На русском, кыргызском и английском.' },
            { icon: '📋', title: 'Сбор заявок', desc: 'Собирает даты, количество гостей, ФИО и телефон. Передаёт менеджеру готовую заявку.' },
            { icon: '📱', title: 'Telegram + WhatsApp', desc: 'Работает в обоих мессенджерах. Гости пишут откуда удобно.' },
            { icon: '🧠', title: 'Знает ваш отель', desc: 'Цены, номера, правила, услуги — бот знает всё и не выдумывает.' },
            { icon: '👨‍💼', title: 'Передача менеджеру', desc: 'Сложные вопросы передаются менеджеру без потери контекста.' },
            { icon: '📊', title: 'Статистика', desc: 'Сколько запросов обработал бот, какие вопросы задают гости.' },
          ].map((f, i) => (
            <div key={i} className="bg-neutral-50 rounded-xl p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-neutral-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Case Study */}
      <section className="bg-blue-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8">Реальный кейс</h2>
          <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto shadow-sm">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🏨</div>
              <h3 className="text-xl font-bold">Отель «Тон Азур», Иссык-Куль</h3>
              <p className="text-neutral-500">17 номеров · с. Тон · работает с февраля 2026</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-600">90+</div>
                <div className="text-sm text-neutral-600">диалогов</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-green-600">86%</div>
                <div className="text-sm text-neutral-600">бот справился сам</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-purple-600">3</div>
                <div className="text-sm text-neutral-600">языка</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Просто и прозрачно</h2>
        <div className="bg-neutral-50 rounded-2xl p-8 max-w-md mx-auto">
          <div className="text-4xl font-bold mb-2">$700</div>
          <div className="text-neutral-500 mb-4">разовая оплата + $20/мес</div>
          <ul className="text-left text-sm space-y-2 mb-6">
            <li>✓ Настройка бота под ваш отель</li>
            <li>✓ Telegram + WhatsApp</li>
            <li>✓ Админ-панель с диалогами</li>
            <li>✓ База знаний + обучение</li>
            <li>✓ AI включён в подписку</li>
            <li>✓ Поддержка 3 месяца</li>
          </ul>
          <Link
            href="/create-bot"
            className="inline-block w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition"
          >
            Создать бота →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm opacity-60">
          © 2026 ASystem · AI-ассистенты для отелей
        </div>
      </footer>
    </div>
  )
}
