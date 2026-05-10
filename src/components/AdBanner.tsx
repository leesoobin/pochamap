'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window { PartnersCoupang: any }
}

export default function AdBanner() {
  const containerRef = useRef<HTMLDivElement>(null)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true

    const script = document.createElement('script')
    script.src = 'https://ads-partners.coupang.com/g.js'
    script.async = true
    script.onload = () => {
      new window.PartnersCoupang.G({
        id: 987741,
        template: 'carousel',
        trackingCode: 'AF7428239',
        width: '320',
        height: '100',
        tsource: '',
      })
      // 쿠팡이 body에 추가한 ins 태그를 컨테이너로 이동
      setTimeout(() => {
        const ins = document.body.querySelector('ins[id^="987741"]')
        if (ins && containerRef.current) {
          containerRef.current.appendChild(ins)
        }
      }, 200)
    }
    document.body.appendChild(script)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 100, overflow: 'hidden', background: '#fff', borderTop: '1px solid #f3f4f6' }}
    />
  )
}
