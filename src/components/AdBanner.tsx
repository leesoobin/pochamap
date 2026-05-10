'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window { PartnersCoupang: any }
}

interface Props {
  onLoad?: () => void
}

export default function AdBanner({ onLoad }: Props) {
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
      // body에 생성된 ins를 containerRef로 이동
      setTimeout(() => {
        const ins = Array.from(document.body.children).find(el => el.tagName === 'INS') as HTMLElement | undefined
        if (ins && containerRef.current) {
          containerRef.current.appendChild(ins)
        }
        setVisible(true)
        onLoad?.()
      }, 600)
    }
    g.onerror = () => {} // 로드 실패 시 아무것도 안 보임
    containerRef.current.appendChild(g)
  }, [])

  if (closed || !visible) return null

  return (
    <div
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 100, zIndex: 15,
        background: '#fff', borderTop: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setClosed(true)}
        style={{
          position: 'absolute', top: 4, right: 8, zIndex: 1,
          width: 20, height: 20, borderRadius: '50%',
          background: 'rgba(0,0,0,0.35)', color: '#fff',
          border: 'none', cursor: 'pointer', fontSize: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
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
