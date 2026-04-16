import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowLeft } from 'lucide-react'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.3) 0%, rgba(52,211,153,0.15) 40%, transparent 70%)' }} />

      <Card className="relative z-10 p-10 text-center max-w-md shadow-[0_12px_40px_rgba(0,0,0,0.3)] animate-scale-in">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-green-400" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2 text-[#FAFAFA]">Заявка отправлена!</h1>
        <p className="text-[#A3A3A3] text-sm leading-relaxed mb-8">
          Мы свяжемся с вами в ближайшее время для настройки бота. Обычно это занимает 1-2 дня.
        </p>
        <Link href="/">
          <Button variant="outline" className="gap-2 rounded-xl">
            <ArrowLeft size={14} /> На главную
          </Button>
        </Link>
      </Card>
    </div>
  )
}
