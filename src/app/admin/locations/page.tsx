'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Location, FoodType, FOOD_EMOJI, FOOD_LABELS } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

const KakaoMap = dynamic(() => import('@/components/map/KakaoMap'), { ssr: false })

const EMPTY_FORM = {
  type: '' as FoodType | '',
  name: '',
  address: '',
  lat: 0,
  lng: 0,
  price: '',
  hours: '',
  description: '',
}

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectingMap, setSelectingMap] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('locations')
      .select('*')
      .order('created_at', { ascending: false })
    setLocations((data as Location[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    const payload = {
      type: form.type,
      name: form.name,
      address: form.address,
      lat: form.lat,
      lng: form.lng,
      price: form.price || null,
      hours: form.hours || null,
      description: form.description || null,
    }

    if (editId) {
      await supabase.from('locations').update(payload).eq('id', editId)
    } else {
      await supabase.from('locations').insert({ ...payload, status: 'approved' })
    }

    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    load()
  }

  const handleEdit = (loc: Location) => {
    setForm({
      type: loc.type,
      name: loc.name,
      address: loc.address,
      lat: loc.lat,
      lng: loc.lng,
      price: loc.price ?? '',
      hours: loc.hours ?? '',
      description: loc.description ?? '',
    })
    setEditId(loc.id)
    setShowForm(true)
  }

  const handleToggleStatus = async (loc: Location) => {
    const supabase = createClient()
    await supabase
      .from('locations')
      .update({ status: loc.status === 'approved' ? 'closed' : 'approved' })
      .eq('id', loc.id)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const supabase = createClient()
    await supabase.from('locations').delete().eq('id', id)
    load()
  }

  const handleMapClick = (lat: number, lng: number, address: string) => {
    setForm(prev => ({ ...prev, lat, lng, address }))
    setSelectingMap(false)
  }

  if (selectingMap) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-4 bg-white border-b shrink-0">
          <button onClick={() => setSelectingMap(false)} className="text-gray-500 hover:text-gray-700">← 돌아가기</button>
          <span className="font-medium">지도에서 위치 선택</span>
        </div>
        <div className="flex-1">
          <KakaoMap locations={[]} activeFilters={[]} onMapClick={handleMapClick} selectMode />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">위치 관리</h1>
        <button
          onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + 직접 추가
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-5 mb-5">
          <h2 className="font-bold text-gray-900 mb-4">{editId ? '위치 수정' : '새 위치 추가'}</h2>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="flex gap-2">
              {(['chicken_skewer', 'bungeobbang', 'takoyaki'] as FoodType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, type }))}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm transition-all ${
                    form.type === type ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {FOOD_EMOJI[type]} {FOOD_LABELS[type]}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSelectingMap(true)}
              className={`w-full py-2 px-4 rounded-lg border-2 text-sm text-left transition-all ${
                form.lat ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-dashed border-gray-300 text-gray-400 hover:border-gray-400'
              }`}
            >
              {form.lat ? `📍 ${form.address}` : '지도에서 위치 선택 →'}
            </button>

            {[
              { key: 'name', label: '이름 *', required: true },
              { key: 'address', label: '주소' },
              { key: 'price', label: '가격' },
              { key: 'hours', label: '운영시간' },
              { key: 'description', label: '설명' },
            ].map(({ key, label, required }) => (
              <input
                key={key}
                type="text"
                required={required}
                placeholder={label}
                value={(form as any)[key]}
                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
              />
            ))}

            <div className="flex gap-2 pt-1">
              <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded-lg transition-colors text-sm">
                저장
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors text-sm">
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">불러오는 중...</p>
      ) : (
        <div className="space-y-2">
          {locations.map(loc => (
            <div key={loc.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${loc.status === 'closed' ? 'opacity-50' : ''}`}>
              <span className="text-2xl">{FOOD_EMOJI[loc.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{loc.name}</p>
                <p className="text-sm text-gray-500 truncate">{loc.address}</p>
                {loc.price && <p className="text-xs text-gray-400">{loc.price}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${loc.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {loc.status === 'approved' ? '운영중' : '폐업'}
                </span>
                <button onClick={() => handleEdit(loc)} className="text-xs text-blue-600 hover:underline">수정</button>
                <button onClick={() => handleToggleStatus(loc)} className="text-xs text-yellow-600 hover:underline">
                  {loc.status === 'approved' ? '폐업처리' : '복구'}
                </button>
                <button onClick={() => handleDelete(loc.id)} className="text-xs text-red-500 hover:underline">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
