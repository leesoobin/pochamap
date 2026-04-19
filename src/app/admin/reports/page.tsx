'use client'

import { useEffect, useState } from 'react'
import { Report, FoodType, FOOD_EMOJI, FOOD_LABELS } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

type Tab = 'pending' | 'approved' | 'rejected'

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [tab, setTab] = useState<Tab>('pending')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('status', tab)
      .order('created_at', { ascending: false })
    setReports((data as Report[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    load()
  }, [tab])

  const handleApprove = async (report: Report) => {
    const supabase = createClient()

    const { data: location } = await supabase
      .from('locations')
      .insert({
        type: report.type,
        name: report.name,
        address: report.address,
        lat: report.lat,
        lng: report.lng,
        price: report.price,
        hours: report.hours,
        description: report.description,
        status: 'approved',
      })
      .select()
      .single()

    await supabase
      .from('reports')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), location_id: location?.id })
      .eq('id', report.id)

    load()
  }

  const handleReject = async (id: string) => {
    const supabase = createClient()
    await supabase
      .from('reports')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', id)
    load()
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pending', label: '대기 중' },
    { key: 'approved', label: '승인됨' },
    { key: 'rejected', label: '거절됨' },
  ]

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">제보 검토</h1>

      <div className="flex gap-2 mb-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-orange-500 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">불러오는 중...</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-400">제보가 없습니다</p>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <div key={report.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{FOOD_EMOJI[report.type as FoodType]}</span>
                    <span className="font-bold text-gray-900">{report.name}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{FOOD_LABELS[report.type as FoodType]}</span>
                  </div>
                  <p className="text-sm text-gray-600">📍 {report.address}</p>
                  {report.price && <p className="text-sm text-gray-500">💰 {report.price}</p>}
                  {report.hours && <p className="text-sm text-gray-500">🕐 {report.hours}</p>}
                  {report.reporter_memo && (
                    <p className="text-sm text-blue-600 mt-1 bg-blue-50 px-3 py-1 rounded-lg">
                      메모: {report.reporter_memo}
                    </p>
                  )}
                  {report.photo_url && (
                    <img src={report.photo_url} alt="제보 사진" className="mt-2 w-32 h-24 object-cover rounded-lg" />
                  )}
                  <p className="text-xs text-gray-400 mt-2">{new Date(report.created_at).toLocaleString('ko-KR')}</p>
                </div>

                {tab === 'pending' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(report)}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => handleReject(report.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      거절
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
