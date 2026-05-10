'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window { PartnersCoupang: any }
}

const AD_ID = 987741

export default function AdBanner() {
  const containerRef = useRef<HTMLDivElement>(null)
  const loaded = useRef(false)
  const [visible, setVisible] = useState(false)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    if (loaded.current || !containerRef.current) return
    loaded.current = true

    function initAd() {
      if (!containerRef.current) return
      const s = document.createElement('script')
      s.text = `new PartnersCoupang.G({"id":${AD_ID},"template":"carousel","trackingCode":"AF7428239","width":"320","height":"100","tsource":""});`
      containerRef.current.appendChild(s)

      // 쿠팡이 body에 생성한 ins를 containerRef로 이동
      setTimeout(() => {
        const ins = document.body.querySelector(`ins[id^="${AD_ID}"]`)
        if (ins && containerRef.current) {
          containerRef.current.appendChild(ins)
          setVisible(true)
        }
      }, 800)
    }

    if (window.PartnersCoupang) { initAd(); return }

    const script = document.createElement('script')
    script.src = 'https://ads-partners.coupang.com/g.js'
    script.async = true
    script.onload = initAd
    document.head.appendChild(script)
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
