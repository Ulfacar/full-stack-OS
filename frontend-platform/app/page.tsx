import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero — Dark */}
      <header className="bg-[#0A0A0A] text-white relative overflow-hidden">
        <nav className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center relative z-10">
          <div className="text-2xl font-bold tracking-tight">
            <span className="text-white">Ex</span>
            <span className="text-blue-400">-Machina</span>
          </div>
          <Link href="/login" className="text-sm text-neutral-400 hover:text-white transition">
            Войти →
          </Link>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium mb-6">
                Готовый кейс: 90+ диалогов, 86% автоматизации
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                AI-бот для вашего отеля
                <br />
                <span className="text-blue-400">за 5 минут</span>
              </h1>
              <p className="text-lg text-neutral-400 mb-8 max-w-lg">
                Заполните опросник прямо на встрече с клиентом — демо-бот готов мгновенно.
                Telegram + WhatsApp. 24/7. На 3 языках.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/hotels/new"
                  className="inline-block bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-blue-600 transition"
                >
                  Создать бота →
                </Link>
                <Link
                  href="/login"
                  className="inline-block border border-neutral-700 text-neutral-300 font-medium px-6 py-4 rounded-xl hover:border-neutral-500 transition"
                >
                  Войти
                </Link>
              </div>
            </div>

            {/* Right: Phone Mockup */}
            <div className="hidden lg:flex justify-center">
              <div className="w-[300px] h-[580px] bg-white rounded-[2.5rem] shadow-2xl shadow-blue-500/10 overflow-hidden border-[6px] border-neutral-800 relative">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-neutral-800 rounded-b-xl z-10" />

                {/* Chat content */}
                <div className="h-full pt-8 flex flex-col bg-neutral-50">
                  {/* Chat header */}
                  <div className="px-4 py-3 border-b border-neutral-200 bg-white">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium text-neutral-900">Ton Azure Bot</span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-3 space-y-2 overflow-hidden">
                    <div className="flex justify-start">
                      <div className="bg-blue-500 text-white px-3 py-2 rounded-2xl text-xs max-w-[85%]">
                        Здравствуйте! Чем могу помочь?
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-white border border-neutral-200 text-neutral-900 px-3 py-2 rounded-2xl text-xs max-w-[85%]">
                        Сколько стоит номер?
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-blue-500 text-white px-3 py-2 rounded-2xl text-xs max-w-[85%]">
                        Стандарт — 3500 сом/ночь (до 2 гостей). Делюкс — 5500 сом. Включён завтрак и Wi-Fi.
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-white border border-neutral-200 text-neutral-900 px-3 py-2 rounded-2xl text-xs max-w-[85%]">
                        А трансфер есть?
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-blue-500 text-white px-3 py-2 rounded-2xl text-xs max-w-[85%]">
                        Да! Трансфер из Бишкека — 5000 сом. Из аэропорта Тамчы — 1500 сом. Забронировать?
                      </div>
                    </div>
                  </div>

                  {/* Input bar */}
                  <div className="px-3 py-2 bg-white border-t border-neutral-200">
                    <div className="flex gap-2">
                      <div className="flex-1 bg-neutral-100 rounded-full px-3 py-1.5 text-xs text-neutral-400">
                        Введите сообщение...
                      </div>
                      <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">→</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle gradient glow */}
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </header>

      {/* How it works — 3 steps */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Как это работает</h2>
        <p className="text-neutral-500 text-center mb-12">От встречи до работающего бота — 3 шага</p>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">1</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Заполняете опросник</h3>
            <p className="text-neutral-500 text-sm">
              Продажник заполняет форму прямо на встрече: номера, цены, правила, удобства. 3 шага, 5 минут.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">2</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Демо-бот готов</h3>
            <p className="text-neutral-500 text-sm">
              Нажимаете "Создать" — AI-бот появляется мгновенно. Клиент тестирует прямо на встрече.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">3</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Бот работает 24/7</h3>
            <p className="text-neutral-500 text-sm">
              Подключаем Telegram или WhatsApp — бот отвечает гостям круглосуточно на 3 языках.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-neutral-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Возможности</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🤖', title: '24/7 ответы', desc: 'Бот отвечает мгновенно, даже ночью. Русский, кыргызский, английский.' },
              { icon: '📋', title: 'Сбор заявок', desc: 'Собирает даты, гостей, ФИО и телефон. Передаёт менеджеру.' },
              { icon: '📱', title: 'Telegram + WhatsApp', desc: 'Оба мессенджера. Гости пишут откуда удобно.' },
              { icon: '🧠', title: 'Знает ваш отель', desc: 'Цены, номера, правила — бот знает всё и не выдумывает.' },
              { icon: '💰', title: 'Контроль расходов', desc: 'Лимит бюджета на каждого бота. Прозрачная аналитика.' },
              { icon: '⚡', title: 'Мгновенная демо', desc: 'Работающий бот за 5 минут. Прямо на встрече с клиентом.' },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-neutral-200">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-neutral-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8">Реальный кейс</h2>
          <div className="bg-neutral-50 rounded-2xl p-8 max-w-2xl mx-auto border border-neutral-200">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold">Ton Azure, Иссык-Куль</h3>
              <p className="text-neutral-500">17 номеров · работает с февраля 2026</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-xl p-4 border border-neutral-200">
                <div className="text-2xl font-bold text-blue-600">90+</div>
                <div className="text-sm text-neutral-500">диалогов</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-neutral-200">
                <div className="text-2xl font-bold text-green-600">86%</div>
                <div className="text-sm text-neutral-500">бот справился сам</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-neutral-200">
                <div className="text-2xl font-bold text-purple-600">3</div>
                <div className="text-sm text-neutral-500">языка</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing — Dark */}
      <section className="bg-[#0A0A0A] text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Просто и прозрачно</h2>
          <p className="text-neutral-400 mb-10">AI включён в подписку. Никаких скрытых платежей.</p>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md mx-auto">
            <div className="text-5xl font-bold mb-1">
              $20<span className="text-lg font-normal text-neutral-500">/мес</span>
            </div>
            <div className="text-neutral-500 mb-6">+ $700 разовая настройка</div>
            <ul className="text-left text-sm space-y-3 mb-8 text-neutral-300">
              <li className="flex items-center gap-2"><span className="text-blue-400">✓</span> AI-бот под ваш отель за 5 минут</li>
              <li className="flex items-center gap-2"><span className="text-blue-400">✓</span> Telegram + WhatsApp</li>
              <li className="flex items-center gap-2"><span className="text-blue-400">✓</span> Админ-панель с аналитикой</li>
              <li className="flex items-center gap-2"><span className="text-blue-400">✓</span> AI включён в подписку</li>
              <li className="flex items-center gap-2"><span className="text-blue-400">✓</span> Поддержка</li>
            </ul>
            <Link
              href="/hotels/new"
              className="inline-block w-full bg-blue-500 text-white font-semibold py-4 rounded-xl hover:bg-blue-600 transition text-lg"
            >
              Создать бота →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A0A0A] border-t border-neutral-800 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-neutral-600">
          © 2026 Ex-Machina · exmachina.kg
        </div>
      </footer>
    </div>
  )
}
