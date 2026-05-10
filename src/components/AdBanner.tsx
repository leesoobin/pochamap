'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window { PartnersCoupang: any }
}

export default function AdBanner() {
  const containerRef = useRef<HTMLDivElement>(null)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current || !containerRef.current) return
    loaded.current = true

    function initAd() {
      if (!containerRef.current) return
      // init 스크립트를 컨테이너 안에서 실행 → 쿠팡이 이 위치에 ins 삽입
      const s = document.createElement('script')
      s.text = `new PartnersCoupang.G({"id":987741,"template":"carousel","trackingCode":"AF7428239","width":"320","height":"100","tsource":""});`
      containerRef.current.appendChild(s)
    }

    if (window.PartnersCoupang) {
      initAd()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://ads-partners.coupang.com/g.js'
    script.async = true
    script.onload = initAd
    document.head.appendChild(script)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 100, overflow: 'hidden', background: '#fff', borderTop: '1px solid #f3f4f6' }}
    />
  )
}
