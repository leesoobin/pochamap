'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { FoodType, Location } from '@/lib/types'
import FilterBar from '@/components/map/FilterBar'
import { createClient } from '@/lib/supabase/client'

const KakaoMap = dynamic(() => import('@/components/map/KakaoMap'), { ssr: false })

export default function HomePage() {
  const [activeFilters, setActiveFilters] = useState<FoodType[]>(['chicken_skewer', 'bungeobbang', 'takoyaki'])
  const [locations, setLocations] = useState<Location[]>([])

  useEffect(() => {
    const supabase = createClient()

    async function fetchAll(type: FoodType): Promise<Location[]> {
      const rows: Location[] = []
      let from = 0
      while (true) {
        const { data } = await supabase
          .from('locations')
          .select('*')
          .eq('status', 'approved')
          .eq('type', type)
          .range(from, from + 999)
        const page = (data as Location[]) ?? []
        rows.push(...page)
        if (page.length < 1000) break
        from += 1000
      }
      return rows
    }

    Promise.all((['chicken_skewer', 'bungeobbang', 'takoyaki'] as FoodType[]).map(fetchAll))
      .then(results => setLocations(results.flat()))
  }, [])

  const toggleFilter = (type: FoodType) => {
    setActiveFilters(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const counts = {
    chicken_skewer: locations.filter(l => l.type === 'chicken_skewer').length,
    bungeobbang: locations.filter(l => l.type === 'bungeobbang').length,
    takoyaki: locations.filter(l => l.type === 'takoyaki').length,
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏮</span>
          <span className="font-bold text-lg text-gray-900">pochamap</span>
        </div>
        <Link
          href="/report"
          className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-3 py-2 rounded-full transition-colors"
        >
          <span>+</span>
          <span>제보하기</span>
        </Link>
      </header>

      <div className="px-4 py-2 bg-white border-b z-10 shrink-0">
        <FilterBar activeFilters={activeFilters} onToggle={toggleFilter} counts={counts} />
      </div>

      <div className="flex-1 relative">
        <KakaoMap locations={locations} activeFilters={activeFilters} />
      </div>
    </div>
  )
}
