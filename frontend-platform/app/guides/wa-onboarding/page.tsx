import Link from 'next/link'

export const metadata = {
  title: 'WhatsApp подключение для отеля — Ex-Machina',
  description: 'Пошаговый гайд: отдельный SIM, прогрев 7-14 дней, Wappi, анти-бан чеклист',
}

export default function WaOnboardingGuide() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/create-bot"
          className="text-sm text-[#3B82F6] hover:underline inline-block mb-8"
        >
          ← Вернуться к визарду
        </Link>

        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
          WhatsApp подключение для отеля
        </h1>
        <p className="text-[#A3A3A3] mb-8">
          Чтобы AI-ассистент отвечал клиентам в WhatsApp, нужен{' '}
          <span className="text-[#FAFAFA]">отдельный, прогретый номер</span>. Этот гайд
          проведёт за 4 шага и убережёт от бана.
        </p>

        <div className="p-4 bg-[#141414] rounded-lg border border-[#262626] mb-10 text-sm">
          <p className="text-[#A3A3A3]">
            <span className="text-[#FAFAFA] font-medium">Время на настройку:</span> ~15
            минут активной работы + 7-14 дней пассивного прогрева.
          </p>
        </div>

        <Section title="Шаг 1. Купите отдельный SIM" num="1">
          <p>
            <span className="text-[#FAFAFA] font-medium">
              Не используйте личный номер владельца или менеджера
            </span>{' '}
            — если WhatsApp забанит номер, вы потеряете и личную переписку, и
            бизнес-канал.
          </p>
          <p className="mt-3 text-[#FAFAFA] font-medium">Что брать в Кыргызстане:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              Любой оператор подойдёт: O!, Mega, Beeline. Возьмите тариф «WhatsApp без
              ограничений» или с большим пакетом интернета (бот работает через сервер,
              но первичная привязка использует мобильный интернет).
            </li>
            <li>
              Стартовый пакет с уже активированной SIM-картой — ускоряет процесс на 1
              день.
            </li>
          </ul>
          <p className="mt-3 text-[#A3A3A3] italic">
            Совет: запишите номер в общий справочник отеля и используйте его в подписи
            на сайте, в Booking, в визитках. Чем больше «живых» сигналов — тем легче
            пройдёт прогрев.
          </p>
        </Section>

        <Section title="Шаг 2. Прогрейте номер 7-14 дней" num="2">
          <p>
            WhatsApp банит «холодные» номера, которые сразу начинают рассылку. Прогрев
            = имитация реального человека.
          </p>

          <p className="mt-4 text-[#FAFAFA] font-medium">Что делать:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              Отправляйте 3-5 сообщений в день <strong>разным</strong> контактам
              (родственники, друзья, коллеги).
            </li>
            <li>
              Ведите переписку, не только односторонние сообщения.{' '}
              <strong>Входящих больше, чем исходящих.</strong>
            </li>
            <li>
              Поставьте аватар, имя «Отель [Название]», статус («На связи 9:00–22:00»).
              Профиль должен выглядеть как у живого бизнеса.
            </li>
            <li>
              Через 5-7 дней начните принимать сообщения от тестовых клиентов через
              сайт/Instagram.
            </li>
          </ul>

          <p className="mt-4 text-[#FAFAFA] font-medium">Чего НЕ делать:</p>
          <ul className="list-none space-y-1 mt-2">
            <li>❌ Массовая рассылка одинакового текста — бан в первый же день.</li>
            <li>❌ Добавление в WhatsApp-группы (особенно в большие).</li>
            <li>
              ❌ Отправка ссылок без контекста, особенно сокращённых (
              <code className="bg-[#1A1A1A] px-1 py-0.5 rounded text-xs">bit.ly</code>,{' '}
              <code className="bg-[#1A1A1A] px-1 py-0.5 rounded text-xs">tinyurl</code>
              ).
            </li>
            <li>
              ❌ Подключение к боту до окончания прогрева. Wappi подключайте на 8-14
              день, не раньше.
            </li>
          </ul>

          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
            <span className="text-amber-400 font-medium">Типичная ошибка:</span>{' '}
            <span className="text-amber-400/90">
              «прогрел 2 дня, всё работает» → через неделю первой реальной нагрузки
              бан. Не торопитесь.
            </span>
          </div>
        </Section>

        <Section title="Шаг 3. Подключите номер в Wappi" num="3">
          <p>Когда номер прогрет:</p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>
              Зарегистрируйтесь на{' '}
              <a
                href="https://wappi.pro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3B82F6] hover:underline"
              >
                wappi.pro
              </a>
              , пополните баланс (от $10).
            </li>
            <li>
              В личном кабинете создайте новый профиль и нажмите «Привязать WhatsApp».
            </li>
            <li>
              На телефоне с прогретым номером откройте WhatsApp →{' '}
              <strong>Настройки → Связанные устройства → Привязать устройство</strong>{' '}
              → отсканируйте QR-код.
            </li>
            <li>
              Скопируйте <code className="bg-[#1A1A1A] px-1 py-0.5 rounded text-xs">profile_id</code> и{' '}
              <code className="bg-[#1A1A1A] px-1 py-0.5 rounded text-xs">api_token</code> из Wappi.
            </li>
            <li>
              Передайте их менеджеру Ex-Machina (или вставьте в визард на шаге
              «Подключите каналы»).
            </li>
          </ol>

          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm">
            <span className="text-emerald-400 font-medium">Важно:</span>{' '}
            <span className="text-emerald-400/90">
              телефон с привязанным номером <strong>не обязан быть постоянно включён</strong>.
              Wappi работает на их сервере. Устройство нужно только для первичной
              привязки и периодической ре-авторизации (раз в несколько недель).
            </span>
          </div>

          <p className="mt-3">
            <a
              href="https://wappi.pro/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3B82F6] hover:underline"
            >
              Официальная инструкция Wappi →
            </a>
          </p>
        </Section>

        <Section title="Шаг 4. Анти-бан чеклист — 5 правил" num="4">
          <p>
            Эти правила — основа, чтобы номер жил долго. Бот настроен соблюдать первые
            3 автоматически, но владелец отеля может нарушить остальные.
          </p>
          <ol className="list-decimal list-inside space-y-2 mt-3">
            <li>
              <strong>Не больше 5-10 сообщений в минуту.</strong> Бот соблюдает debounce
              1.5 сек — это безопасно. Если менеджер вручную пишет 20 клиентам подряд —
              риск бана.
            </li>
            <li>
              <strong>Без спама.</strong> Если клиент нажмёт «Спам» в WhatsApp — это
              сильный негативный сигнал. Никогда не пишите первыми тем, кто не просил
              контакта.
            </li>
            <li>
              <strong>Персонализируйте сообщения.</strong> Бот это делает по умолчанию
              (использует имя клиента, контекст диалога). Менеджер при ручной рассылке
              должен делать то же самое.
            </li>
            <li>
              <strong>Не пишите со старого/банного устройства.</strong> Если этот же
              телефон ранее банился WhatsApp — высокий риск повторного бана.
            </li>
            <li>
              <strong>Если номер всё-таки забанили</strong> — не паникуйте: см. FAQ
              ниже.
            </li>
          </ol>
        </Section>

        <h2 className="text-2xl font-semibold mt-12 mb-6 text-[#FAFAFA]">FAQ</h2>

        <Faq q="Устройство должно быть всегда включено?">
          <p>
            <strong>Нет.</strong> Wappi работает на их сервере. Телефон нужен только
            для первичной привязки QR-кодом и иногда для повторной авторизации (раз в
            2-4 недели). В остальное время телефон может лежать в сейфе отеля.
          </p>
        </Faq>

        <Faq q="Что делать, если номер забанили?">
          <ol className="list-decimal list-inside space-y-1">
            <li>Не пытайтесь сразу разбанить через приложение — обычно не работает.</li>
            <li>
              Свяжитесь с поддержкой WhatsApp:{' '}
              <a
                href="https://www.whatsapp.com/contact/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3B82F6] hover:underline"
              >
                whatsapp.com/contact
              </a>{' '}
              → «У меня заблокирован аккаунт». Опишите что это бизнес-номер отеля.
            </li>
            <li>
              Параллельно купите запасной SIM и начните прогрев нового номера, чтобы
              простой канала был минимальным.
            </li>
            <li>
              Проанализируйте причину: спам? слишком быстрые рассылки? плохой контент?
              Исправьте перед запуском нового номера.
            </li>
            <li>
              Сообщите Ex-Machina — мы поможем перенастроить бота на новый номер за 10
              минут.
            </li>
          </ol>
        </Faq>

        <Faq q="Можно использовать существующий номер отеля?">
          <p>
            <strong>Можно</strong>, если:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              Номер активно используется <strong>14+ дней</strong> с реальной
              перепиской (не только исходящие).
            </li>
            <li>На номере НЕТ предыдущих банов или жалоб.</li>
            <li>
              Вы готовы рискнуть — если этот номер забанят, вы потеряете и переписку, и
              историю клиентов.
            </li>
          </ul>
          <p className="mt-3">
            <strong>Безопаснее</strong> — отдельный SIM. $5/мес за тариф окупается
            одной непотерянной бронью.
          </p>
        </Faq>

        <Faq q="Сколько стоит Wappi?">
          <p>
            От $10/месяц за 1 профиль (1 номер). Тариф включает неограниченную отправку
            сообщений в рамках лимитов WhatsApp (5-10/мин). Это{' '}
            <strong>отдельная подписка от Ex-Machina</strong> — оплачивается напрямую
            Wappi.
          </p>
        </Faq>

        <Faq q="Когда бот начнёт работать?">
          <p>
            После того, как вы передадите{' '}
            <code className="bg-[#1A1A1A] px-1 py-0.5 rounded text-xs">profile_id</code>{' '}
            +{' '}
            <code className="bg-[#1A1A1A] px-1 py-0.5 rounded text-xs">api_token</code>{' '}
            через визард или менеджера, бот включится за{' '}
            <strong>5-10 минут</strong>. Тестовое сообщение клиенту → ответ бота →
            готово.
          </p>
        </Faq>

        <div className="mt-12 p-6 bg-[#141414] rounded-lg border border-[#262626]">
          <h3 className="text-lg font-medium text-[#FAFAFA] mb-2">Что дальше</h3>
          <p className="text-[#A3A3A3] text-sm">
            После завершения прогрева и подключения вернитесь в{' '}
            <Link href="/create-bot" className="text-[#3B82F6] hover:underline">
              визард создания бота
            </Link>{' '}
            и заполните поле «Подключение WhatsApp». Если номер ещё прогревается —
            оставьте поле пустым, бот стартует только на Telegram, а WhatsApp
            подключите позже через настройки отеля.
          </p>
          <p className="text-[#A3A3A3] text-sm mt-3">
            <strong className="text-[#FAFAFA]">Вопросы?</strong> Напишите менеджеру
            Ex-Machina или ответьте на это сообщение в админке.
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl md:text-2xl font-semibold text-[#FAFAFA] mb-4 flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] text-sm font-medium">
          {num}
        </span>
        {title.replace(/^Шаг \d+\.\s*/, '')}
      </h2>
      <div className="text-[#D4D4D4] text-sm md:text-base leading-relaxed space-y-1">
        {children}
      </div>
    </section>
  )
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 p-5 bg-[#141414] rounded-lg border border-[#262626]">
      <h3 className="text-base md:text-lg font-medium text-[#FAFAFA] mb-2">{q}</h3>
      <div className="text-[#A3A3A3] text-sm leading-relaxed">{children}</div>
    </div>
  )
}
