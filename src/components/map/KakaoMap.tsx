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
    if (window.kakao?.maps?.Map) {
      resolve()
      return
    }

    const existing = document.getElementById('kakao-map-script')
    if (existing) {
      existing.addEventListener('load', () => {
        window.kakao.maps.load(resolve)
      })
      return
    }

    const script = document.createElement('script')
    script.id = 'kakao-map-script'
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services&autoload=false`
    script.onload = () => window.kakao.maps.load(resolve)
    document.head.appendChild(script)
  })
}

export default function KakaoMap({ locations, activeFilters, onMapClick, onBoundsChange, selectMode = false }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const overlaysRef = useRef<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const onMapClickRef = useRef(onMapClick)
  const onBoundsChangeRef = useRef(onBoundsChange)

  useEffect(() => {
    onMapClickRef.current = onMapClick
  }, [onMapClick])

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange
  }, [onBoundsChange])

  useEffect(() => {
    let cancelled = false
    let map: any = null
    let idleHandler: (() => void) | null = null
    let clickHandler: ((mouseEvent: any) => void) | null = null

    loadKakaoScript().then(() => {
      if (cancelled || !mapRef.current) return

      map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780),
        level: 7,
      })

      const emitBounds = () => {
        if (!onBoundsChangeRef.current) return
        const mapBounds = map.getBounds()
        const sw = mapBounds.getSouthWest()
        const ne = mapBounds.getNorthEast()
        onBoundsChangeRef.current({
          south: sw.getLat(),
          west: sw.getLng(),
          north: ne.getLat(),
          east: ne.getLng(),
        })
      }

      mapInstanceRef.current = map
      setMapReady(true)

      idleHandler = () => emitBounds()
      window.kakao.maps.event.addListener(map, 'idle', idleHandler)
      emitBounds()

      if (selectMode) {
        clickHandler = (mouseEvent: any) => {
          const onMapClickHandler = onMapClickRef.current
          if (!onMapClickHandler) return

          const latlng = mouseEvent.latLng
          const geocoder = new window.kakao.maps.services.Geocoder()
          geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const address = result[0]?.road_address?.address_name || result[0]?.address?.address_name || ''
              onMapClickHandler(latlng.getLat(), latlng.getLng(), address)
            }
          })
        }
        window.kakao.maps.event.addListener(map, 'click', clickHandler)
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          if (!cancelled) {
            map.setCenter(new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude))
            map.setLevel(4)
          }
        })
      }
    })

    return () => {
      cancelled = true
      if (map && idleHandler) {
        window.kakao.maps.event.removeListener(map, 'idle', idleHandler)
      }
      if (map && clickHandler) {
        window.kakao.maps.event.removeListener(map, 'click', clickHandler)
      }
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
        content.addEventListener('click', () => setSelectedLocation(loc))

        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(loc.lat, loc.lng),
          content,
          yAnchor: 1,
        })
        overlay.setMap(map)
        overlaysRef.current.push(overlay)
      })
  }, [locations, activeFilters, mapReady])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {selectedLocation && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl p-4 w-80 z-10">
          <button onClick={() => setSelectedLocation(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">✕</button>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{FOOD_EMOJI[selectedLocation.type]}</span>
            <div>
              <p className="font-bold text-gray-900">{selectedLocation.name}</p>
              <p className="text-xs text-gray-500">{FOOD_LABELS[selectedLocation.type]}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">📍 {selectedLocation.address}</p>
          {selectedLocation.price && <p className="text-sm text-gray-600 mb-1">💰 {selectedLocation.price}</p>}
          {selectedLocation.hours && <p className="text-sm text-gray-600">🕐 {selectedLocation.hours}</p>}
          {selectedLocation.description && (
            <p className="text-sm text-gray-500 mt-2 border-t pt-2">{selectedLocation.description}</p>
          )}
        </div>
      )}
    </div>
  )
}
