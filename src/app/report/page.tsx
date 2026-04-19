'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { FoodType, FOOD_EMOJI, FOOD_LABELS } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

const KakaoMap = dynamic(() => import('@/components/map/KakaoMap'), { ssr: false })

const FOOD_TYPES: FoodType[] = ['chicken_skewer', 'bungeobbang', 'takoyaki']

export default function ReportPage() {
  const [step, setStep] = useState<'form' | 'map' | 'done'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    type: '' as FoodType | '',
    name: '',
    address: '',
    lat: 0,
    lng: 0,
    price: '',
    hours: '',
    description: '',
    reporter_memo: '',
  })
  const [photo, setPhoto] = useState<File | null>(null)

  const handleMapClick = (lat: number, lng: number, address: string) => {
    setForm(prev => ({ ...prev, lat, lng, address }))
    setStep('form')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.type || !form.name || !form.lat) return

    setSubmitting(true)
    const supabase = createClient()

    let photo_url: string | null = null
    if (photo) {
      const ext = photo.name.split('.').pop()
      const path = `${Date.now()}.${ext}`
      const { data: uploadData } = await supabase.storage
        .from('report-photos')
        .upload(path, photo)
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('report-photos').getPublicUrl(path)
        photo_url = urlData.publicUrl
      }
    }

    const { error } = await supabase.from('reports').insert({
      type: form.type,
      name: form.name,
      address: form.address,
      lat: form.lat,
      lng: form.lng,
      price: form.price || null,
      hours: form.hours || null,
      description: form.description || null,
      reporter_memo: form.reporter_memo || null,
      photo_url,
      status: 'pending',
    })

    setSubmitting(false)
    if (!error) setStep('done')
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900">제보 완료!</h2>
        <p className="text-gray-500">검토 후 지도에 표시될 예정이에요.<br />감사합니다 🙏</p>
        <Link href="/" className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-full transition-colors">
          지도로 돌아가기
        </Link>
      </div>
    )
  }

  if (step === 'map') {
    return (
      <div className="flex flex-col h-full">
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b shrink-0">
          <button onClick={() => setStep('form')} className="text-gray-500 hover:text-gray-700">← 돌아가기</button>
          <span className="font-medium text-gray-900">지도에서 위치 선택</span>
        </header>
        <div className="flex-1 relative">
          {form.lat !== 0 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white rounded-full shadow px-4 py-2 text-sm z-10">
              📍 {form.address || `${form.lat.toFixed(5)}, ${form.lng.toFixed(5)}`}
            </div>
          )}
          <KakaoMap locations={[]} activeFilters={[]} onMapClick={handleMapClick} selectMode />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b shrink-0">
        <Link href="/" className="text-gray-500 hover:text-gray-700">← 지도</Link>
        <span className="font-bold text-gray-900">길거리 음식 제보</span>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* 음식 종류 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">음식 종류 *</label>
          <div className="flex gap-2">
            {FOOD_TYPES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, type }))}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.type === type
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl">{FOOD_EMOJI[type]}</div>
                <div>{FOOD_LABELS[type]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 위치 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">위치 *</label>
          <button
            type="button"
            onClick={() => setStep('map')}
            className={`w-full py-3 px-4 rounded-xl border-2 text-sm text-left transition-all ${
              form.lat ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-dashed border-gray-300 text-gray-400 hover:border-gray-400'
            }`}
          >
            {form.lat ? `📍 ${form.address || `${form.lat.toFixed(5)}, ${form.lng.toFixed(5)}`}` : '지도에서 위치 선택하기 →'}
          </button>
        </div>

        {/* 이름/가격/운영시간 */}
        {[
          { key: 'name', label: '가게명 / 위치 설명 *', placeholder: '예) 홍대입구역 2번 출구 앞 닭꼬치', required: true },
          { key: 'price', label: '가격대', placeholder: '예) 2,000원 / 3개 5,000원' },
          { key: 'hours', label: '운영시간', placeholder: '예) 오후 3시 ~ 밤 11시' },
        ].map(({ key, label, placeholder, required }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type="text"
              required={required}
              value={(form as any)[key]}
              onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>
        ))}

        {/* 메모 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">추가 메모</label>
          <textarea
            value={form.reporter_memo}
            onChange={e => setForm(prev => ({ ...prev, reporter_memo: e.target.value }))}
            placeholder="관리자에게 전달할 메모 (선택)"
            rows={3}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 resize-none"
          />
        </div>

        {/* 사진 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">사진 (선택)</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setPhoto(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !form.type || !form.name || !form.lat}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-xl transition-colors"
        >
          {submitting ? '제출 중...' : '제보하기'}
        </button>
      </form>
    </div>
  )
}
