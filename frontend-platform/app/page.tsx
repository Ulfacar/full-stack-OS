'use client'

import Link from 'next/link'
import { ArrowRight, ArrowUpRight, MessageSquare, Globe, Zap, BarChart3, Shield, Layers, Check, Star } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="antialiased selection:bg-amber-200/30 selection:text-amber-900 relative">
      {/* Grain overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 w-full z-40 bg-[#1A1814]/80 backdrop-blur-xl border-b border-[#2A2520]/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display text-xl tracking-tight text-[#F5F0EB]">
            Ex<span className="text-[#C8A96E]">—</span>Machina
          </span>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#A69F93]">
            <a href="#how" className="hover:text-[#F5F0EB] transition-colors">Процесс</a>
            <a href="#features" className="hover:text-[#F5F0EB] transition-colors">Возможности</a>
            <a href="#cases" className="hover:text-[#F5F0EB] transition-colors">Кейсы</a>
            <a href="#pricing" className="hover:text-[#F5F0EB] transition-colors">Тарифы</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#A69F93] hover:text-[#F5F0EB] transition-colors">
              Войти
            </Link>
            <Link href="/create-bot" className="text-sm bg-[#C8A96E] hover:bg-[#B89A5F] text-[#1A1814] px-4 py-2 rounded-md font-medium transition-all">
              Создать бота
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center bg-[#1A1814] overflow-hidden">
        {/* Warm gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-[#C8A96E]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-[#8B7355]/5 rounded-full blur-[100px]" />

        {/* Diagonal line decoration */}
        <div className="absolute top-0 right-[20%] w-px h-full bg-gradient-to-b from-transparent via-[#2A2520] to-transparent opacity-40" />
        <div className="absolute top-0 right-[40%] w-px h-full bg-gradient-to-b from-transparent via-[#2A2520] to-transparent opacity-20" />

        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10">
          <div className="grid md:grid-cols-12 gap-8 items-end">
            {/* Left — Main content */}
            <div className="md:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2A2520] text-xs text-[#A69F93] tracking-wider uppercase">
                <span className="w-1.5 h-1.5 bg-[#C8A96E] rounded-full animate-pulse-soft" />
                AI для гостеприимства
              </div>

              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-[#F5F0EB] leading-[0.95] tracking-tight">
                Продавайте
                <br />
                <span className="italic text-[#C8A96E]">AI-ботов</span>
                <br />
                прямо на встрече
              </h1>

              <p className="text-lg md:text-xl text-[#A69F93] max-w-lg leading-relaxed">
                Заполните опросник за 5 минут — клиент увидит работающий продукт мгновенно. Никакого кода.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/create-bot" className="group bg-[#C8A96E] hover:bg-[#B89A5F] text-[#1A1814] px-8 py-3.5 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2">
                  Начать бесплатно
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/login" className="border border-[#2A2520] hover:border-[#C8A96E]/30 text-[#A69F93] hover:text-[#F5F0EB] px-8 py-3.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2">
                  Смотреть демо
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

            {/* Right — Stats card */}
            <div className="md:col-span-5 md:pl-12">
              <div className="bg-[#211F1A] border border-[#2A2520] rounded-2xl p-8 space-y-6 landing-card-enter">
                <div className="text-xs text-[#A69F93] tracking-wider uppercase mb-4">Результаты клиентов</div>
                <div className="space-y-5">
                  {[
                    { value: '86%', label: 'автоматизация рутинных запросов', color: 'text-[#C8A96E]' },
                    { value: '90+', label: 'диалогов в день на отель', color: 'text-[#F5F0EB]' },
                    { value: '2 сек', label: 'среднее время ответа бота', color: 'text-[#C8A96E]' },
                    { value: '15x', label: 'быстрее чем ручная обработка', color: 'text-[#F5F0EB]' },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-baseline justify-between border-b border-[#2A2520]/50 pb-4 last:border-0 last:pb-0">
                      <span className={`font-display text-3xl tracking-tight ${stat.color}`}>{stat.value}</span>
                      <span className="text-xs text-[#6B6560] max-w-[160px] text-right leading-tight">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom border accent */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#C8A96E]/20 to-transparent" />
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="bg-[#F5F0EB] text-[#1A1814] py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-12 mb-20">
            <div className="md:col-span-5">
              <span className="text-xs tracking-wider uppercase text-[#8B7355] font-medium">Процесс</span>
              <h2 className="font-display text-4xl md:text-5xl tracking-tight mt-4 leading-[1.05]">
                От брифа до
                <br />
                <span className="italic">готового AI</span>
              </h2>
            </div>
            <div className="md:col-span-5 md:col-start-8 flex items-end">
              <p className="text-[#6B6560] leading-relaxed">
                Процесс продаж меняется навсегда. Покажите клиенту результат, а не презентацию. Три шага — и у вас работающий продукт.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Заполните опросник',
                desc: 'Прямо на встрече с отельером внесите базовые данные: название, цены, услуги, правила.',
              },
              {
                num: '02',
                title: 'AI создаёт бота',
                desc: 'Система генерирует промпты и обучает модель на данных отеля. Демо готово за секунды.',
              },
              {
                num: '03',
                title: 'Бот работает 24/7',
                desc: 'Подключите Telegram или WhatsApp. 86% запросов обрабатываются без участия человека.',
              },
            ].map((step, i) => (
              <div key={i} className="group relative bg-white border border-[#E5DFD6] rounded-xl p-8 hover:border-[#C8A96E]/40 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(200,169,110,0.08)]">
                <span className="font-display text-6xl text-[#E5DFD6] group-hover:text-[#C8A96E]/30 transition-colors absolute top-6 right-8">{step.num}</span>
                <div className="relative pt-12">
                  <h3 className="text-lg font-semibold tracking-tight mb-3">{step.title}</h3>
                  <p className="text-sm text-[#6B6560] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="bg-[#1A1814] text-[#F5F0EB] py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs tracking-wider uppercase text-[#C8A96E] font-medium">Возможности</span>
            <h2 className="font-display text-4xl md:text-5xl tracking-tight mt-4">
              Всё для <span className="italic">автоматизации</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#2A2520]/50 border border-[#2A2520] rounded-2xl overflow-hidden">
            {[
              { icon: Globe, title: 'Мультиязычность', desc: 'Бот понимает и отвечает на десятках языков, подстраиваясь под клиента автоматически.' },
              { icon: MessageSquare, title: 'Telegram & WhatsApp', desc: 'Подключение к самым популярным мессенджерам в пару кликов.' },
              { icon: Zap, title: 'Умный контекст', desc: 'AI помнит историю диалога и учитывает специфику конкретного отеля.' },
              { icon: BarChart3, title: 'Контроль бюджета', desc: 'Визуальный прогресс-бар расхода AI. Лимиты и уведомления при превышении.' },
              { icon: Layers, title: 'Dashboard', desc: 'Единая панель управления всеми подключенными отелями и аналитикой.' },
              { icon: Shield, title: 'Надёжность', desc: 'Архитектура на Next.js 14 + FastAPI — тысячи запросов без задержек.' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="bg-[#1A1814] p-8 hover:bg-[#211F1A] transition-colors group">
                  <div className="w-10 h-10 rounded-lg border border-[#2A2520] flex items-center justify-center mb-5 group-hover:border-[#C8A96E]/30 transition-colors">
                    <Icon size={18} strokeWidth={1.5} className="text-[#C8A96E]" />
                  </div>
                  <h3 className="text-base font-medium tracking-tight mb-2">{item.title}</h3>
                  <p className="text-sm text-[#6B6560] leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ CASE STUDIES ═══ */}
      <section id="cases" className="bg-[#F5F0EB] text-[#1A1814] py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <div>
              <span className="text-xs tracking-wider uppercase text-[#8B7355] font-medium">Кейсы</span>
              <h2 className="font-display text-4xl md:text-5xl tracking-tight mt-4">
                Успешные <span className="italic">внедрения</span>
              </h2>
            </div>
            <p className="text-[#6B6560] max-w-md leading-relaxed">
              Отели, которые уже автоматизировали общение с гостями и увеличили продажи.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Ton Azure',
                type: 'Бутик-отель',
                quote: 'Разгрузили ресепшн в пиковый сезон. Бот взял на себя ответы, бронирование спа и консультации.',
                stats: { dialogs: '90+/день', auto: '86%', speed: '2 сек' },
              },
              {
                name: 'Grand Hotel Bishkek',
                type: 'Бизнес-отель',
                quote: 'Мультиязычный бот для международных гостей. Обрабатывает запросы на 3 языках 24/7.',
                stats: { dialogs: '2.4K/мес', auto: '$1.2K экономия', speed: '99.9% uptime' },
              },
              {
                name: 'Mountain Lodge',
                type: 'Горный курорт',
                quote: 'Бот помогает гостям бронировать экскурсии и трансферы прямо в Telegram.',
                stats: { dialogs: '340+ броней', auto: '42% конверсия', speed: '+28% чек' },
              },
            ].map((c, i) => (
              <div key={i} className="bg-white border border-[#E5DFD6] rounded-xl overflow-hidden hover:shadow-[0_12px_48px_rgba(200,169,110,0.1)] transition-all duration-300 group">
                {/* Header bar */}
                <div className="h-1 bg-gradient-to-r from-[#C8A96E] to-[#8B7355]" />
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#1A1814] flex items-center justify-center">
                      <Star size={14} className="text-[#C8A96E]" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{c.name}</div>
                      <div className="text-xs text-[#8B7355]">{c.type}</div>
                    </div>
                  </div>

                  <p className="text-sm text-[#6B6560] leading-relaxed mb-8 min-h-[60px]">
                    &ldquo;{c.quote}&rdquo;
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#E5DFD6]">
                    {Object.entries(c.stats).map(([_, val], j) => (
                      <div key={j} className="text-center">
                        <div className="font-display text-lg text-[#1A1814] tracking-tight">{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="bg-[#1A1814] text-[#F5F0EB] py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs tracking-wider uppercase text-[#C8A96E] font-medium">Тарифы</span>
            <h2 className="font-display text-4xl md:text-5xl tracking-tight mt-4">
              Прозрачные <span className="italic">условия</span>
            </h2>
            <p className="text-sm text-[#6B6560] mt-4">Никаких скрытых платежей. Выберите план под ваш бизнес.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '$129',
                period: '/мес',
                limit: 'До 1 000 сообщений',
                features: ['Неограниченное кол-во ботов', 'AI-модель: DeepSeek', 'Канал: Telegram', 'Базовая аналитика'],
                highlighted: false,
              },
              {
                name: 'Business',
                price: '$249',
                period: '/мес',
                limit: 'До 5 000 сообщений',
                features: ['Неограниченное кол-во ботов', 'AI-модель: GPT-4', 'Telegram + WhatsApp', 'Интеграция Exely', 'Расширенная аналитика'],
                highlighted: false,
              },
              {
                name: 'Premium',
                price: '$299',
                period: '/мес',
                limit: 'До 20 000 сообщений',
                features: ['Неограниченное кол-во ботов', 'AI: GPT-4 + Claude', 'Все каналы', 'Полная интеграция Exely', 'Полная аналитика + экспорт'],
                highlighted: true,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-8 border transition-all duration-300 ${
                  plan.highlighted
                    ? 'border-[#C8A96E]/40 bg-[#211F1A] shadow-[0_0_40px_rgba(200,169,110,0.06)]'
                    : 'border-[#2A2520] bg-[#1A1814] hover:border-[#2A2520]/80'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold tracking-widest uppercase bg-[#C8A96E] text-[#1A1814] px-4 py-1 rounded-full">
                    Популярный
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-base font-medium tracking-tight mb-4 text-[#A69F93]">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-5xl tracking-tight text-[#F5F0EB]">{plan.price}</span>
                    <span className="text-sm text-[#6B6560]">{plan.period}</span>
                  </div>
                  <div className="text-xs text-[#6B6560] mt-2">{plan.limit}</div>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <Check size={14} strokeWidth={2} className={plan.highlighted ? 'text-[#C8A96E] mt-0.5' : 'text-[#6B6560] mt-0.5'} />
                      <span className="text-sm text-[#A69F93]">{f}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/create-bot"
                  className={`block w-full py-3 rounded-md text-sm font-medium text-center transition-all ${
                    plan.highlighted
                      ? 'bg-[#C8A96E] hover:bg-[#B89A5F] text-[#1A1814]'
                      : 'border border-[#2A2520] hover:border-[#C8A96E]/30 text-[#A69F93] hover:text-[#F5F0EB]'
                  }`}
                >
                  Начать
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#1A1814] border-t border-[#2A2520]/50 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-display text-lg tracking-tight text-[#A69F93]">
            Ex<span className="text-[#C8A96E]">—</span>Machina
          </span>
          <div className="flex items-center gap-8 text-xs text-[#6B6560]">
            <a href="#how" className="hover:text-[#A69F93] transition-colors">Процесс</a>
            <a href="#features" className="hover:text-[#A69F93] transition-colors">Возможности</a>
            <a href="#cases" className="hover:text-[#A69F93] transition-colors">Кейсы</a>
            <a href="#pricing" className="hover:text-[#A69F93] transition-colors">Тарифы</a>
          </div>
          <div className="text-xs text-[#6B6560]">
            &copy; 2026 Ex-Machina
          </div>
        </div>
      </footer>
    </div>
  )
}
