'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window { PartnersCoupang: any }
}

export default function AdBanner() {
  const containerRef = useRef<HTMLDivElement>(null)
  const loaded = useRef(false)
  const [visible, setVisible] = useState(false)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    if (loaded.current || !containerRef.current) return
    loaded.current = true

    // 3초 내 광고 미로드 시 자동 숨김
    const timeout = setTimeout(() => setVisible(false), 3000)

    function initAd() {
      if (!containerRef.current) return
      const s = document.createElement('script')
      s.text = `new PartnersCoupang.G({"id":987741,"template":"carousel","trackingCode":"AF7428239","width":"320","height":"100","tsource":""});`
      containerRef.current.appendChild(s)
      // 광고 DOM 생성 대기 후 visible
      setTimeout(() => {
        clearTimeout(timeout)
        if (containerRef.current?.querySelector('ins, iframe')) {
          setVisible(true)
        }
      }, 800)
    }

    if (window.PartnersCoupang) { initAd(); return }

    const script = document.createElement('script')
    script.src = 'https://ads-partners.coupang.com/g.js'
    script.async = true
    script.onload = initAd
    script.onerror = () => clearTimeout(timeout)
    document.head.appendChild(script)

    return () => clearTimeout(timeout)
  }, [])

  if (closed || !visible) return null

  return (
    <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 15, width: 320 }}>
      <button
        onClick={() => setClosed(true)}
        style={{
          position: 'absolute', top: -10, right: -10, zIndex: 1,
          width: 22, height: 22, borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)', color: '#fff',
          border: 'none', cursor: 'pointer', fontSize: 11,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="광고 닫기"
      >✕</button>
      <div
        ref={containerRef}
        style={{
          width: 320, height: 100, overflow: 'hidden',
          borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          background: '#fff',
        }}
      />
    </div>
  )
}
