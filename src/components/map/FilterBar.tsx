'use client'

import { FoodType, FOOD_EMOJI, FOOD_LABELS } from '@/lib/types'

interface Props {
  activeFilters: FoodType[]
  onToggle: (type: FoodType) => void
  counts?: Record<FoodType, number>
}

const ALL_TYPES: FoodType[] = ['chicken_skewer', 'bungeobbang', 'takoyaki']

const ACTIVE_STYLE: Record<FoodType, { bg: string; color: string }> = {
  chicken_skewer: { bg: '#FFF2EB', color: '#C24A10' },
  bungeobbang:    { bg: '#FFFBEC', color: '#9A6400' },
  takoyaki:       { bg: '#F5EDFF', color: '#6B2FA0' },
}

export default function FilterBar({ activeFilters, onToggle, counts }: Props) {
  return (
    <div className="flex">
      {ALL_TYPES.map(type => {
        const active = activeFilters.includes(type)
        const style = ACTIVE_STYLE[type]
        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            className="flex items-center gap-1 h-10 px-3 rounded-t-lg text-[12.5px] whitespace-nowrap transition-all"
            style={active
              ? { background: style.bg, color: style.color, fontWeight: 700 }
              : { color: '#AAAAAA', fontWeight: 500 }
            }
          >
            <span className="text-sm">{FOOD_EMOJI[type]}</span>
            <span>{FOOD_LABELS[type]}</span>
            {counts !== undefined && (
              <span className="text-[10px] opacity-60 ml-0.5">{counts[type]}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
