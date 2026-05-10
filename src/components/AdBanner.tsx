'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window { PartnersCoupang: any }
}

export default function AdBanner() {
  const containerRef = useRef<HTMLDivElement>(null)
  const loaded = useRef(false)
  const [closed, setClosed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (loaded.current || !containerRef.current) return
    loaded.current = true

    function initAd() {
      if (!containerRef.current) return
      const s = document.createElement('script')
      s.text = `new PartnersCoupang.G({"id":987741,"template":"carousel","trackingCode":"AF7428239","width":"320","height":"100","tsource":""});`
      containerRef.current.appendChild(s)
      setReady(true)
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

  if (closed) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 15,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        background: '#fff',
      }}
    >
      <button
        onClick={() => setClosed(true)}
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          zIndex: 1,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
        title="광고 닫기"
      >✕</button>
      <div
        ref={containerRef}
        style={{ width: 320, height: 100, overflow: 'hidden' }}
      />
    </div>
  )
}
