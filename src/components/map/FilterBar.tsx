'use client'

import { FoodType, FOOD_EMOJI, FOOD_LABELS, FOOD_COLORS } from '@/lib/types'

interface Props {
  activeFilters: FoodType[]
  onToggle: (type: FoodType) => void
  counts?: Record<FoodType, number>
}

const ALL_TYPES: FoodType[] = ['chicken_skewer', 'bungeobbang', 'takoyaki']

export default function FilterBar({ activeFilters, onToggle, counts }: Props) {
  return (
    <div className="flex gap-1.5">
      {ALL_TYPES.map(type => {
        const active = activeFilters.includes(type)
        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all border-2 whitespace-nowrap"
            style={{
              borderColor: FOOD_COLORS[type],
              background: active ? FOOD_COLORS[type] : 'white',
              color: active ? 'white' : FOOD_COLORS[type],
            }}
          >
            <span>{FOOD_EMOJI[type]}</span>
            <span>{FOOD_LABELS[type]}</span>
            {counts && <span className="text-xs opacity-75">({counts[type]})</span>}
          </button>
        )
      })}
    </div>
  )
}
