'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowRight, Clipboard, Sparkles, MessageCircleMore, Globe, Settings2, Smartphone, PieChart, Layout, Shield, Check } from 'lucide-react'
import ClickSpark from '@/components/effects/ClickSpark'
import SpotlightCard from '@/components/effects/SpotlightCard'
import PhoneMockup from '@/components/landing/PhoneMockup'
import { CaseFlipCard } from '@/components/landing/CaseFlipCard'
import { ClipboardWriteIcon, SparklesAnimIcon, ChatBotIcon } from '@/components/landing/StepIcons'
import CardNav from '@/components/layout/CardNav'

const Antigravity = dynamic(() => import('@/components/effects/Antigravity'), { ssr: false })

const navCards = [
  {
    label: 'Как это работает',
    href: '#how-it-works',
    description: 'От брифа до готового AI-бота за 3 шага',
    bgColor: '#1a1a2e',
    textColor: '#fff',
  },
  {
    label: 'Возможности',
    href: '#features',
    description: 'Telegram, WhatsApp, аналитика и интеграции',
    bgColor: '#0f2744',
    textColor: '#fff',
  },
  {
    label: 'Кейсы',
    href: '#case',
    description: 'Реальные результаты наших клиентов',
    bgColor: '#1a1a2e',
    textColor: '#fff',
  },
  {
    label: 'Тарифы',
    href: '#pricing',
    description: 'Прозрачные условия без скрытых платежей',
    bgColor: '#0f2744',
    textColor: '#fff',
  },
]

export default function LandingPage() {
  return (
    <div className="antialiased selection:bg-[#3B82F6]/30 selection:text-white">
      {/* Navbar */}
      <CardNav cards={navCards} />

      {/* Hero Section */}
      <ClickSpark sparkColor="#fff" sparkSize={10} sparkRadius={15} sparkCount={8} duration={400}>
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-[#0A0A0A]">
        {/* Antigravity particle background */}
        <div className="absolute inset-0 pointer-events-auto">
          <Antigravity
            count={200}
            magnetRadius={6}
            ringRadius={7}
            waveSpeed={0.3}
            waveAmplitude={1}
            particleSize={3}
            lerpSpeed={0.04}
            color="#3B82F6"
            autoAnimate
            particleVariance={1.5}
            depthFactor={1}
            pulseSpeed={2}
            particleShape="capsule"
            fieldStrength={8}
          />
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-[#3B82F6]/8 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center pointer-events-none">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#262626] bg-[#0A0A0A] text-xs text-[#A3A3A3] mb-8">
              <Sparkles size={14} className="text-[#3B82F6]" />
              <span>Создание демо-бота за 5 минут</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold text-white mb-6 leading-[1.1] tracking-tight">
              Продавайте AI-ботов прямо на встрече с клиентом.
            </h1>
            <p className="text-base text-[#A3A3A3] mb-8 leading-relaxed">
              SaaS-платформа для создания умных ассистентов для отелей. Заполните опросник, и ваш клиент увидит работающий продукт мгновенно. Никакого кода.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pointer-events-auto">
              <Link href="/create-bot" className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 group shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                Начать бесплатно
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/login" className="border border-[#262626] text-[#D4D4D4] hover:bg-[#1A1A1A] px-5 py-2.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2">
                Смотреть демо
              </Link>
              <Link
                href="/compare"
                className="text-[#A3A3A3] hover:text-[#FAFAFA] px-5 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                Сравнить с конкурентами →
              </Link>
            </div>
          </div>

          {/* Phone Mockup */}
          <PhoneMockup />
        </div>
      </section>
      </ClickSpark>

      {/* Light sections — blue sparks */}
      <ClickSpark sparkColor="#3B82F6" sparkSize={10} sparkRadius={15} sparkCount={8} duration={400}>
      <section id="how-it-works" className="bg-white text-[#0A0A0A] py-24 border-t border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-semibold tracking-tight mb-4">От брифа до готового AI за минуты</h2>
            <p className="text-sm text-[#737373]">Процесс продаж меняется навсегда. Покажите клиенту результат, а не презентацию.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Track 1: icon 1 → icon 2 */}
            <div className="hidden md:block absolute top-6 left-[8%] h-[4px] bg-[#E5E5E5] rounded-full" style={{ width: '38%' }} />
            <div className="hidden md:block absolute top-6 left-[8%] h-[4px] bg-[#3B82F6] rounded-full" style={{ width: '38%', transformOrigin: 'left', animation: 'progressBar1 6s linear infinite' }} />
            {/* Track 2: icon 2 → icon 3 */}
            <div className="hidden md:block absolute top-6 left-[54%] h-[4px] bg-[#E5E5E5] rounded-full" style={{ width: '38%' }} />
            <div className="hidden md:block absolute top-6 left-[54%] h-[4px] bg-[#3B82F6] rounded-full" style={{ width: '38%', transformOrigin: 'left', animation: 'progressBar2 6s linear infinite' }} />

            <div className="relative bg-white z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-center mb-6 shadow-sm">
                <ClipboardWriteIcon />
              </div>
              <div className="text-xs font-medium text-[#3B82F6] mb-2">Шаг 1</div>
              <h3 className="text-lg font-medium tracking-tight mb-2">Заполняете опросник</h3>
              <p className="text-sm text-[#737373]">Прямо на встрече с отельером вносите базовые данные: название, цены, услуги.</p>
            </div>

            <div className="relative bg-white z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-center mb-6 shadow-sm">
                <SparklesAnimIcon />
              </div>
              <div className="text-xs font-medium text-[#3B82F6] mb-2">Шаг 2</div>
              <h3 className="text-lg font-medium tracking-tight mb-2">Демо-бот готов</h3>
              <p className="text-sm text-[#737373]">Система моментально генерирует промпты и обучает модель на ваших данных.</p>
            </div>

            <div className="relative bg-white z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-center mb-6 shadow-sm">
                <ChatBotIcon />
              </div>
              <div className="text-xs font-medium text-[#3B82F6] mb-2">Шаг 3</div>
              <h3 className="text-lg font-medium tracking-tight mb-2">Бот работает 24/7</h3>
              <p className="text-sm text-[#737373]">Клиент тестирует бота в Telegram или WhatsApp. 86% автоматизации рутины.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-[#FAFAFA] text-[#0A0A0A] py-24 border-t border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-semibold tracking-tight mb-12 text-center">Всё, что нужно для автоматизации</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Globe, title: 'Мультиязычность', desc: 'Бот понимает и отвечает на десятках языков, автоматически подстраиваясь под клиента.' },
              { icon: Settings2, title: 'Умный контекст', desc: 'AI помнит историю диалога и учитывает специфику конкретного отеля.' },
              { icon: Smartphone, title: 'Telegram & WhatsApp', desc: 'Подключение к самым популярным мессенджерам в пару кликов.' },
              { icon: PieChart, title: 'Контроль бюджета', desc: 'Визуальный прогресс-бар расхода AI. Лимиты и уведомления.' },
              { icon: Layout, title: 'Удобный Dashboard', desc: 'Единая панель для управления всеми подключенными отелями.' },
              { icon: Shield, title: 'Надёжность', desc: 'Архитектура на Next.js 14 — тысячи запросов без задержек.' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <SpotlightCard key={item.title} className="bg-white border border-[#E5E5E5] rounded-xl p-6 hover:border-[#D4D4D4]" spotlightColor="rgba(59, 130, 246, 0.08)">
                  <Icon size={24} strokeWidth={1.5} className="text-[#0A0A0A] mb-4" />
                  <h3 className="text-base font-medium tracking-tight mb-2">{item.title}</h3>
                  <p className="text-xs text-[#737373] leading-relaxed">{item.desc}</p>
                </SpotlightCard>
              )
            })}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section id="case" className="bg-white text-[#0A0A0A] py-24 border-t border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-semibold tracking-tight mb-4">Успешные кейсы</h2>
            <p className="text-sm text-[#737373]">Отели, которые уже автоматизировали общение с гостями</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CaseFlipCard data={{
              name: 'Ton Azure',
              tag: 'Бутик-отель',
              description: 'Разгрузили ресепшн в пиковый сезон. Бот взял на себя ответы на частые вопросы, бронирование спа и консультации.',
              stats: [
                { label: 'Диалогов / день', value: '90+' },
                { label: 'Автоматизация', value: '86%', color: 'text-[#10B981]' },
                { label: 'Языков', value: '3' },
                { label: 'Время ответа', value: '2 сек', color: 'text-[#3B82F6]' },
              ],
              result: 'Полная автоматизация рутинных запросов гостей за 2 недели внедрения.',
            }} />

            <CaseFlipCard data={{
              name: 'Grand Hotel Bishkek',
              tag: 'Бизнес-отель',
              description: 'Мультиязычный бот для международных гостей. Обрабатывает запросы на русском, английском и турецком 24/7.',
              stats: [
                { label: 'Запросов / мес', value: '2.4K' },
                { label: 'Экономия', value: '$1.2K', color: 'text-[#10B981]' },
                { label: 'Каналов', value: '2' },
                { label: 'Uptime', value: '99.9%', color: 'text-[#3B82F6]' },
              ],
              result: 'Сократили нагрузку на ресепшн на 60%, увеличили скорость ответа в 15 раз.',
            }} />

            <CaseFlipCard data={{
              name: 'Mountain Lodge',
              tag: 'Горный курорт',
              description: 'Бот помогает гостям бронировать экскурсии, трансферы и спа прямо в Telegram без звонков на ресепшн.',
              stats: [
                { label: 'Бронирований', value: '340+' },
                { label: 'Конверсия', value: '42%', color: 'text-[#10B981]' },
                { label: 'Доп. продажи', value: '+28%' },
                { label: 'NPS', value: '94', color: 'text-[#3B82F6]' },
              ],
              result: 'Допродажи через бота увеличили средний чек гостя на 28%.',
            }} />
          </div>
        </div>
      </section>
      </ClickSpark>

      {/* Pricing + Footer — white sparks */}
      <ClickSpark sparkColor="#fff" sparkSize={10} sparkRadius={15} sparkCount={8} duration={400}>
      <section id="pricing" className="bg-[#0A0A0A] text-[#FAFAFA] py-24 pb-12 border-t border-[#262626]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold tracking-tight mb-4 text-white">Прозрачные условия</h2>
            <p className="text-sm text-[#A3A3A3]">Выберите тариф, который подходит вашему бизнесу. Никаких скрытых платежей.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter */}
            <SpotlightCard className="border border-[#262626] bg-[#0A0A0A] rounded-2xl p-8 relative overflow-hidden" spotlightColor="rgba(59, 130, 246, 0.08)">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#262626] to-transparent" />
              <div className="mb-8">
                <h3 className="text-lg font-medium tracking-tight mb-2 text-white">Starter</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-white">$129</span>
                  <span className="text-sm text-[#A3A3A3]">/ мес</span>
                </div>
                <div className="text-xs text-[#737373] mt-2">До 1 000 сообщений / мес</div>
              </div>
              <div className="space-y-3 mb-8">
                {[
                  'Неограниченное кол-во ботов',
                  'AI-модель: DeepSeek',
                  'Канал: Telegram',
                  'Базовая аналитика',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Check size={16} strokeWidth={1.5} className="text-[#A3A3A3] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#A3A3A3]">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/create-bot" className="block w-full border border-[#262626] hover:border-[#3B82F6]/50 text-[#D4D4D4] hover:text-white font-medium py-2.5 rounded-md text-sm transition-all text-center">
                Начать
              </Link>
            </SpotlightCard>

            {/* Business */}
            <SpotlightCard className="border border-[#262626] bg-[#0A0A0A] rounded-2xl p-8 relative overflow-hidden" spotlightColor="rgba(59, 130, 246, 0.08)">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#262626] to-transparent" />
              <div className="mb-8">
                <h3 className="text-lg font-medium tracking-tight mb-2 text-white">Business</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-white">$249</span>
                  <span className="text-sm text-[#A3A3A3]">/ мес</span>
                </div>
                <div className="text-xs text-[#737373] mt-2">До 5 000 сообщений / мес</div>
              </div>
              <div className="space-y-3 mb-8">
                {[
                  'Неограниченное кол-во ботов',
                  'AI-модель: GPT-4',
                  'Telegram + WhatsApp',
                  'Интеграция Exely (базовая)',
                  'Расширенная аналитика',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Check size={16} strokeWidth={1.5} className="text-[#A3A3A3] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#A3A3A3]">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/create-bot" className="block w-full border border-[#262626] hover:border-[#3B82F6]/50 text-[#D4D4D4] hover:text-white font-medium py-2.5 rounded-md text-sm transition-all text-center">
                Начать
              </Link>
            </SpotlightCard>

            {/* Premium — highlighted */}
            <SpotlightCard className="border border-[#3B82F6]/40 bg-[#0A0A0A] rounded-2xl p-8 relative overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.1)]" spotlightColor="rgba(59, 130, 246, 0.15)">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-60" />
              <div className="absolute top-4 right-4 text-[10px] font-medium tracking-wider uppercase bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 px-2 py-0.5 rounded-full">
                Выгодный
              </div>
              <div className="mb-8">
                <h3 className="text-lg font-medium tracking-tight mb-2 text-white">Premium</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-white">$299</span>
                  <span className="text-sm text-[#A3A3A3]">/ мес</span>
                </div>
                <div className="text-xs text-[#737373] mt-2">До 20 000 сообщений / мес</div>
              </div>
              <div className="space-y-3 mb-8">
                {[
                  'Неограниченное кол-во ботов',
                  'AI-модели: GPT-4 + Claude',
                  'Все каналы',
                  'Полная интеграция Exely',
                  'Полная аналитика + экспорт',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Check size={16} strokeWidth={1.5} className="text-[#3B82F6] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#D4D4D4]">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/create-bot" className="block w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium py-2.5 rounded-md text-sm transition-all text-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                Начать
              </Link>
            </SpotlightCard>
          </div>

          {/* Footer */}
          <footer className="mt-24 pt-8 border-t border-[#262626] flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="font-medium text-base tracking-tighter text-[#A3A3A3]">
              Ex<span className="text-[#3B82F6]">-Machina</span>
            </span>
            <div className="text-xs text-[#737373]">
              &copy; 2026 Ex-Machina &middot; exmachina.kg
            </div>
          </footer>
        </div>
      </section>
      </ClickSpark>
    </div>
  )
}
