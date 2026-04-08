import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import type { HotelFormData, RoomCategory } from '@/lib/types'

interface Step2Props {
  formData: Partial<HotelFormData>
  updateFormData: (data: Partial<HotelFormData>) => void
}

export function Step2({ formData, updateFormData }: Step2Props) {
  const rooms = formData.rooms || []

  const addRoom = () => {
    updateFormData({
      rooms: [
        ...rooms,
        { name: '', count: 1, capacity: 2, price: 0, description: '' },
      ],
    })
  }

  const updateRoom = (index: number, field: keyof RoomCategory, value: any) => {
    const newRooms = [...rooms]
    newRooms[index] = { ...newRooms[index], [field]: value }
    updateFormData({ rooms: newRooms })
  }

  const removeRoom = (index: number) => {
    updateFormData({
      rooms: rooms.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Номера и цены
        </h2>
        <p className="text-neutral-500 text-sm">
          Добавьте категории номеров с ценами. Бот будет автоматически отвечать на вопросы о стоимости.
        </p>
      </div>

      {/* Rooms list */}
      <div className="space-y-4">
        {rooms.map((room, index) => (
          <Card key={index} className="relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Номер #{index + 1}</h3>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeRoom(index)}
              >
                Удалить
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Название (Twin/Double)</Label>
                  <Input
                    placeholder="Twin/Double"
                    value={room.name}
                    onChange={(e) => updateRoom(index, 'name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Вместимость</Label>
                  <Input
                    type="number"
                    placeholder="2"
                    value={room.capacity}
                    onChange={(e) =>
                      updateRoom(index, 'capacity', parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Цена (сом/сутки)</Label>
                <Input
                  type="number"
                  placeholder="8000"
                  value={room.price}
                  onChange={(e) =>
                    updateRoom(index, 'price', parseInt(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Описание (опционально)</Label>
                <Textarea
                  placeholder="Уютный номер с видом на горы, кондиционер, телевизор..."
                  rows={2}
                  value={room.description || ''}
                  onChange={(e) => updateRoom(index, 'description', e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add button */}
      <Button variant="outline" onClick={addRoom} className="w-full">
        + Добавить категорию номеров
      </Button>

      {rooms.length > 0 && (
        <div className="text-sm text-neutral-500 text-center">
          Итого категорий: {rooms.length}
        </div>
      )}
    </div>
  )
}
