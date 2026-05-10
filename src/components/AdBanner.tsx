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

    // toss와 동일하게: g.js → init script 순서대로 컨테이너 안에 삽입
    const g = document.createElement('script')
    g.src = 'https://ads-partners.coupang.com/g.js'
    g.async = true
    g.onload = () => {
      const init = document.createElement('script')
      init.text = `new PartnersCoupang.G({"id":987741,"template":"carousel","trackingCode":"AF7428239","width":"320","height":"100","tsource":""});`
      containerRef.current?.appendChild(init)
      // 광고 렌더링 대기 후 표시
      setTimeout(() => setVisible(true), 600)
    }
    g.onerror = () => {} // 로드 실패 시 아무것도 안 보임
    containerRef.current.appendChild(g)
  }, [])

  if (closed) return null

  return (
    <div
      style={{
        position: 'fixed', bottom: 20, left: '50%',
        transform: 'translateX(-50%)', zIndex: 15, width: 320,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.3s',
      }}
    >
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
