import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-12 shadow-sm text-center max-w-md">
        <div className="text-5xl mb-4">&#127881;</div>
        <h1 className="text-2xl font-bold mb-2">Заявка отправлена!</h1>
        <p className="text-neutral-500 mb-6">
          Мы свяжемся с вами в ближайшее время для настройки бота. Обычно это занимает 1-2 дня.
        </p>
        <Link href="/" className="text-blue-600 hover:underline">На главную</Link>
      </div>
    </div>
  )
}
