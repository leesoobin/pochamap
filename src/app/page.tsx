'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { FoodType, Location } from '@/lib/types'
import FilterBar from '@/components/map/FilterBar'
import { createClient } from '@/lib/supabase/client'

const KakaoMap = dynamic(() => import('@/components/map/KakaoMap'), { ssr: false })

interface MapBounds {
  south: number
  west: number
  north: number
  east: number
}

const DEFAULT_TYPES: FoodType[] = ['chicken_skewer', 'bungeobbang', 'takoyaki']

export default function HomePage() {
  const [activeFilters, setActiveFilters] = useState<FoodType[]>(DEFAULT_TYPES)
  const [locations, setLocations] = useState<Location[]>([])
  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [loading, setLoading] = useState(false)
  const fetchSeqRef = useRef(0)

  useEffect(() => {
    if (!bounds) return

    if (activeFilters.length === 0) return

    const timer = setTimeout(async () => {
      const supabase = createClient()
      const requestId = ++fetchSeqRef.current
      setLoading(true)

      const { data, error } = await supabase
        .from('locations')
        .select('id,type,name,address,lat,lng,price,hours,description,status,created_at,updated_at')
        .eq('status', 'approved')
        .in('type', activeFilters)
        .gte('lat', bounds.south)
        .lte('lat', bounds.north)
        .gte('lng', bounds.west)
        .lte('lng', bounds.east)
        .limit(2000)

      if (requestId !== fetchSeqRef.current) return

      if (error) {
        console.error('Failed to fetch map locations', error)
        setLocations([])
      } else {
        setLocations((data as Location[]) ?? [])
      }

      setLoading(false)
    }, 250)

    return () => clearTimeout(timer)
  }, [bounds, activeFilters])

  const toggleFilter = (type: FoodType) => {
    setActiveFilters(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const visibleLocations = activeFilters.length === 0 ? [] : locations

  const counts = {
    chicken_skewer: visibleLocations.filter(l => l.type === 'chicken_skewer').length,
    bungeobbang: visibleLocations.filter(l => l.type === 'bungeobbang').length,
    takoyaki: visibleLocations.filter(l => l.type === 'takoyaki').length,
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
        {loading && <p className="text-xs text-gray-500 mt-1">지도 범위 데이터를 불러오는 중...</p>}
      </div>

      <div className="flex-1 relative">
        <KakaoMap
          locations={visibleLocations}
          activeFilters={activeFilters}
          onBoundsChange={setBounds}
        />
      </div>
    </div>
  )
}
