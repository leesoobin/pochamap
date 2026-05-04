'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { FoodType, Location } from '@/lib/types'
import FilterBar from '@/components/map/FilterBar'
// import AdBanner from '@/components/AdBanner'
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
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const headerRef = useRef<HTMLElement>(null)
  const fetchSeqRef = useRef(0)

  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => setHeaderHeight(entries[0].contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('locations')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setLastUpdated(data[0].created_at)
      })
  }, [])

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

  const AD_HEIGHT = 0 // 광고 승인 후 60으로 변경

  return (
    <>
      <header ref={headerRef} className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-[15px] leading-none">
              🍢
            </div>
            <div className="flex flex-col gap-[3px]">
              <span className="font-bold text-[15px] text-gray-900 leading-none tracking-tight">pochamap</span>
              <span className="text-[10px] text-gray-400 font-medium leading-none">내 주변 길거리 음식</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-[9px] text-gray-300 font-medium">
                {new Date(lastUpdated).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} 기준
              </span>
            )}
            <Link
              href="/report"
              className="flex items-center gap-1.5 border border-gray-200 text-gray-500 text-[11px] font-semibold px-3 h-7 rounded-full hover:border-orange-300 hover:text-orange-500 transition-colors"
            >
              <span className="w-3.5 h-3.5 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center leading-none shrink-0">+</span>
              제보하기
            </Link>
          </div>
        </div>
        <div className="px-2">
          <FilterBar activeFilters={activeFilters} onToggle={toggleFilter} counts={counts} />
        </div>
      </header>

      <div
        style={{
          position: 'fixed',
          top: headerHeight,
          left: 0,
          right: 0,
          bottom: AD_HEIGHT,
        }}
      >
        <KakaoMap
          locations={visibleLocations}
          activeFilters={activeFilters}
          onBoundsChange={setBounds}
        />
        {loading && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm pointer-events-none">
            <p className="text-[11px] text-gray-500 font-medium whitespace-nowrap">불러오는 중...</p>
          </div>
        )}
      </div>

      {/* AdSense 광고 승인 후 활성화
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: AD_HEIGHT, overflow: 'hidden' }}>
        <AdBanner />
      </div>
      */}
    </>
  )
}
