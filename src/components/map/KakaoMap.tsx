'use client'

import { useEffect, useRef, useState } from 'react'
import { Location, FoodType, FOOD_EMOJI, FOOD_COLORS, FOOD_LABELS } from '@/lib/types'

declare global {
  interface Window {
    kakao: any
  }
}

interface Props {
  locations: Location[]
  activeFilters: FoodType[]
  onMapClick?: (lat: number, lng: number, address: string) => void
  onBoundsChange?: (bounds: { south: number; west: number; north: number; east: number }) => void
  selectMode?: boolean
}

function loadKakaoScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.kakao?.maps?.Map) { resolve(); return }
    const existing = document.getElementById('kakao-map-script')
    if (existing) { existing.addEventListener('load', () => window.kakao.maps.load(resolve)); return }
    const script = document.createElement('script')
    script.id = 'kakao-map-script'
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services&autoload=false`
    script.onload = () => window.kakao.maps.load(resolve)
    document.head.appendChild(script)
  })
}

function ensureMyLocationStyle() {
  if (document.getElementById('pochamap-myloc-style')) return
  const style = document.createElement('style')
  style.id = 'pochamap-myloc-style'
  style.textContent = `
    @keyframes pochamap-pulse {
      0%   { box-shadow: 0 0 0 0    rgba(0,122,255,0.4), 0 2px 6px rgba(0,122,255,0.3); }
      70%  { box-shadow: 0 0 0 14px rgba(0,122,255,0),   0 2px 6px rgba(0,122,255,0.3); }
      100% { box-shadow: 0 0 0 0    rgba(0,122,255,0),   0 2px 6px rgba(0,122,255,0.3); }
    }
    .pochamap-my-loc {
      width:14px; height:14px; border-radius:50%;
      background:#007AFF; border:2.5px solid #fff;
      animation: pochamap-pulse 2.5s ease-out infinite;
    }
  `
  document.head.appendChild(style)
}

export default function KakaoMap({ locations, activeFilters, onMapClick, onBoundsChange, selectMode = false }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const overlaysRef = useRef<any[]>([])
  const myLocOverlayRef = useRef<any>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const onMapClickRef = useRef(onMapClick)
  const onBoundsChangeRef = useRef(onBoundsChange)

  useEffect(() => { onMapClickRef.current = onMapClick }, [onMapClick])
  useEffect(() => { onBoundsChangeRef.current = onBoundsChange }, [onBoundsChange])

  const showMyLocation = (lat: number, lng: number) => {
    const map = mapInstanceRef.current
    if (!map) return
    ensureMyLocationStyle()
    if (myLocOverlayRef.current) myLocOverlayRef.current.setMap(null)
    const dot = document.createElement('div')
    dot.className = 'pochamap-my-loc'
    const overlay = new window.kakao.maps.CustomOverlay({
      position: new window.kakao.maps.LatLng(lat, lng),
      content: dot,
      zIndex: 5,
    })
    overlay.setMap(map)
    myLocOverlayRef.current = overlay
  }

  useEffect(() => {
    let cancelled = false
    let map: any = null
    let idleHandler: (() => void) | null = null
    let clickHandler: ((e: any) => void) | null = null

    loadKakaoScript().then(() => {
      if (cancelled || !mapRef.current) return

      map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780),
        level: 7,
      })

      const emitBounds = () => {
        if (!onBoundsChangeRef.current) return
        const b = map.getBounds()
        const sw = b.getSouthWest(), ne = b.getNorthEast()
        onBoundsChangeRef.current({ south: sw.getLat(), west: sw.getLng(), north: ne.getLat(), east: ne.getLng() })
      }

      mapInstanceRef.current = map
      setMapReady(true)
      idleHandler = () => emitBounds()
      window.kakao.maps.event.addListener(map, 'idle', idleHandler)
      emitBounds()

      if (selectMode) {
        clickHandler = (mouseEvent: any) => {
          const handler = onMapClickRef.current
          if (!handler) return
          const latlng = mouseEvent.latLng
          const geocoder = new window.kakao.maps.services.Geocoder()
          geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const address = result[0]?.road_address?.address_name || result[0]?.address?.address_name || ''
              handler(latlng.getLat(), latlng.getLng(), address)
            }
          })
        }
        window.kakao.maps.event.addListener(map, 'click', clickHandler)
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          if (cancelled) return
          const { latitude, longitude } = pos.coords
          map.setCenter(new window.kakao.maps.LatLng(latitude, longitude))
          map.setLevel(4)
          showMyLocation(latitude, longitude)
        })
      }
    })

    return () => {
      cancelled = true
      if (map && idleHandler) window.kakao.maps.event.removeListener(map, 'idle', idleHandler)
      if (map && clickHandler) window.kakao.maps.event.removeListener(map, 'click', clickHandler)
    }
  }, [selectMode])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapReady) return

    overlaysRef.current.forEach(o => o.setMap(null))
    overlaysRef.current = []

    locations
      .filter(loc => activeFilters.includes(loc.type))
      .forEach(loc => {
        const content = document.createElement('div')
        content.style.cssText = `
          display:flex; align-items:center; justify-content:center;
          width:36px; height:36px; border-radius:50%;
          background:${FOOD_COLORS[loc.type]}; color:white; font-size:18px;
          box-shadow:0 2px 6px rgba(0,0,0,0.3); cursor:pointer;
          border:2px solid white;
        `
        content.textContent = FOOD_EMOJI[loc.type]
        content.addEventListener('click', () => {
          mapInstanceRef.current?.panTo(new window.kakao.maps.LatLng(loc.lat, loc.lng))
          setSelectedLocation(loc)
        })

        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(loc.lat, loc.lng),
          content,
          yAnchor: 1,
        })
        overlay.setMap(map)
        overlaysRef.current.push(overlay)
      })
  }, [locations, activeFilters, mapReady])

  const goToMyLocation = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      const map = mapInstanceRef.current
      map.setCenter(new window.kakao.maps.LatLng(latitude, longitude))
      map.setLevel(4)
      showMyLocation(latitude, longitude)
    })
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      <button
        onClick={goToMyLocation}
        className="absolute bottom-4 right-4 w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-md flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors z-10"
        title="현재 위치"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
        </svg>
      </button>

      {selectedLocation && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-20">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>
          <button
            onClick={() => setSelectedLocation(null)}
            className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-lg leading-none"
          >✕</button>
          <div className="px-5 pb-8 pt-1">
            <p className="text-sm text-gray-400 mb-1">
              {FOOD_EMOJI[selectedLocation.type]} {FOOD_LABELS[selectedLocation.type]}
            </p>
            <p className="text-xl font-bold text-gray-900 mb-2">{selectedLocation.name}</p>
            <p className="text-sm text-gray-600 mb-1">📍 {selectedLocation.address}</p>
            {selectedLocation.price && <p className="text-sm text-gray-600 mb-1">💰 {selectedLocation.price}</p>}
            {selectedLocation.hours && <p className="text-sm text-gray-600 mb-1">🕐 {selectedLocation.hours}</p>}
            {selectedLocation.description?.startsWith('당근마켓 제보') && (
              <p className="text-xs text-gray-400 mt-3">
                🌐 커뮤니티 제보 · {new Date(selectedLocation.created_at).toLocaleDateString('ko-KR')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
