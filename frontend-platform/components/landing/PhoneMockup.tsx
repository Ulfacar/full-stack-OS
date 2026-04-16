'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles } from 'lucide-react'

interface Message {
  type: 'bot' | 'user'
  text: string
}

const CONVERSATION: Message[] = [
  { type: 'bot', text: 'Здравствуйте! Я AI-ассистент вашего отеля. Чем могу помочь?' },
  { type: 'user', text: 'Есть номера на 15-18 мая для двоих?' },
  { type: 'bot', text: 'Да! На эти даты доступен Делюкс с видом на горы — 4 200 ₽/ночь. Завтрак включён. Забронировать?' },
  { type: 'user', text: 'А есть что-то подешевле?' },
  { type: 'bot', text: 'Конечно. Стандарт — 2 800 ₽/ночь. Уютный номер с балконом и Wi-Fi. Показать фото?' },
  { type: 'user', text: 'Да, покажите. И какой чекаут?' },
  { type: 'bot', text: 'Выезд до 12:00, но можно продлить до 14:00 бесплатно. Отправляю фото номера.' },
  { type: 'user', text: 'Отлично, бронируйте стандарт!' },
  { type: 'bot', text: 'Готово! Бронь #1847 подтверждена на 15-18 мая. Ссылку на оплату отправлю следующим сообщением.' },
]

const USER_TYPE_SPEED = 40    // ms per char in input bar
const PAUSE_BEFORE_SEND = 300 // pause after typing before "sending"
const BOT_THINK_DELAY = 800   // bot "thinking" dots
const PAUSE_AFTER_MSG = 1000  // pause between messages
const RESTART_DELAY = 4000

type Phase = 'idle' | 'user-typing' | 'user-sent' | 'bot-thinking' | 'bot-sent'

export default function PhoneMockup() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isBotThinking, setIsBotThinking] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)
  const chatRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, inputText, isBotThinking])

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  useEffect(() => {
    // Restart loop
    if (msgIndex >= CONVERSATION.length) {
      timerRef.current = setTimeout(() => {
        setMessages([])
        setInputText('')
        setIsBotThinking(false)
        setMsgIndex(0)
      }, RESTART_DELAY)
      return
    }

    const msg = CONVERSATION[msgIndex]

    if (msg.type === 'user') {
      // Type text character by character in the input bar
      let charIdx = 0
      setInputText('')

      timerRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          charIdx++
          if (charIdx <= msg.text.length) {
            setInputText(msg.text.slice(0, charIdx))
          } else {
            if (intervalRef.current) clearInterval(intervalRef.current)
            // Pause, then "send" — move text from input to chat
            timerRef.current = setTimeout(() => {
              setInputText('')
              setMessages(prev => [...prev, { type: 'user', text: msg.text }])
              timerRef.current = setTimeout(() => {
                setMsgIndex(i => i + 1)
              }, PAUSE_AFTER_MSG)
            }, PAUSE_BEFORE_SEND)
          }
        }, USER_TYPE_SPEED)
      }, 400)

    } else {
      // Bot: show thinking dots, then drop full message
      setIsBotThinking(true)

      timerRef.current = setTimeout(() => {
        setIsBotThinking(false)
        setMessages(prev => [...prev, { type: 'bot', text: msg.text }])
        timerRef.current = setTimeout(() => {
          setMsgIndex(i => i + 1)
        }, PAUSE_AFTER_MSG)
      }, BOT_THINK_DELAY + Math.random() * 600)
    }
  }, [msgIndex])

  return (
    <div className="hidden md:flex justify-end relative">
      <div className="relative w-[300px] h-[600px] bg-black border-[6px] border-[#262626] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
        {/* Notch */}
        <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-10">
          <div className="w-32 h-6 bg-[#262626] rounded-b-xl" />
        </div>

        {/* Chat Header */}
        <div className="px-4 pt-10 pb-3 border-b border-[#262626] flex items-center gap-3 bg-[#0A0A0A]">
          <div className="w-8 h-8 rounded-full bg-[#3B82F6]/20 flex items-center justify-center">
            <Sparkles size={14} className="text-[#3B82F6]" />
          </div>
          <div>
            <div className="text-sm font-medium text-white leading-none mb-1">Ваш AI ассистент</div>
            <div className="text-[10px] text-[#10B981] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Онлайн
            </div>
          </div>
        </div>

        {/* Chat Body */}
        <div ref={chatRef} className="flex-1 bg-[#0A0A0A] p-4 flex flex-col gap-3 overflow-y-auto text-sm no-scrollbar">
          <div className="text-xs text-center text-[#737373] my-1">Сегодня</div>

          {messages.map((msg, i) => (
            msg.type === 'bot' ? (
              <div key={i} className="flex gap-2 max-w-[85%] animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
                <div className="w-5 h-5 rounded-full bg-[#3B82F6]/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Sparkles size={10} className="text-[#3B82F6]" />
                </div>
                <div className="bg-[#1A1A1A] border border-[#262626] px-3 py-2 rounded-2xl rounded-tl-sm text-[13px] text-[#FAFAFA] leading-relaxed">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-end max-w-[85%] ml-auto animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
                <div className="bg-[#3B82F6] text-white px-3 py-2 rounded-2xl rounded-tr-sm text-[13px] leading-relaxed">
                  {msg.text}
                </div>
              </div>
            )
          ))}

          {/* Bot thinking dots */}
          {isBotThinking && (
            <div className="flex gap-2 max-w-[85%] animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
              <div className="w-5 h-5 rounded-full bg-[#3B82F6]/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                <Sparkles size={10} className="text-[#3B82F6]" />
              </div>
              <div className="bg-[#1A1A1A] border border-[#262626] px-3 py-2.5 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-[#737373] rounded-full animate-pulse" />
                <div className="w-1.5 h-1.5 bg-[#737373] rounded-full animate-pulse [animation-delay:100ms]" />
                <div className="w-1.5 h-1.5 bg-[#737373] rounded-full animate-pulse [animation-delay:200ms]" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-[#262626] bg-[#0A0A0A]">
          <div className={`rounded-full h-9 px-4 flex items-center gap-2 transition-colors duration-200 ${
            inputText
              ? 'bg-[#1A1A1A] border border-[#3B82F6]/40'
              : 'bg-[#1A1A1A] border border-[#262626]'
          }`}>
            <div className="flex-1 min-w-0 overflow-hidden">
              {inputText ? (
                <span className="text-[#FAFAFA] text-xs whitespace-nowrap">
                  {inputText}
                  <span className="inline-block w-[1.5px] h-3 bg-[#3B82F6] ml-0.5 animate-pulse align-middle" />
                </span>
              ) : (
                <span className="text-[#737373] text-xs">Написать сообщение...</span>
              )}
            </div>
            <Send size={14} className={`flex-shrink-0 transition-colors duration-200 ${
              inputText ? 'text-[#3B82F6]' : 'text-[#737373]'
            }`} />
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -right-6 top-32 bg-[#262626] border border-[#3B82F6]/30 text-xs px-3 py-2 rounded-lg text-white shadow-lg flex items-center gap-2 animate-float">
        <Sparkles size={12} className="text-[#3B82F6]" />
        Ответ за 2 сек
      </div>
    </div>
  )
}
