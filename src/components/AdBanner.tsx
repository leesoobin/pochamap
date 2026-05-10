'use client'

import { useState, useEffect } from 'react'

interface Props {
  onLoad?: (height: number) => void
  onClose?: () => void
}

const MOBILE_AD = { id: 987741, width: 320, height: 100 }
const PC_AD    = { id: 987758, width: 728, height: 90 }

function makeHtml(ad: typeof MOBILE_AD) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent"><script src="https://ads-partners.coupang.com/g.js"><\/script><script>new PartnersCoupang.G({"id":${ad.id},"template":"carousel","trackingCode":"AF7428239","width":"${ad.width}","height":"${ad.height}","tsource":""});<\/script></body></html>`
}

export default function AdBanner({ onLoad, onClose }: Props) {
  const [closed, setClosed] = useState(false)
  const [ad, setAd] = useState(MOBILE_AD)

  useEffect(() => {
    const config = window.innerWidth >= 768 ? PC_AD : MOBILE_AD
    setAd(config)
  }, [])

  if (closed) return null

  return (
    <div
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: ad.height, zIndex: 15,
        background: '#fff', borderTop: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <button
        onClick={() => { setClosed(true); onClose?.() }}
        style={{
          position: 'absolute', top: 4, right: 8,
          width: 20, height: 20, borderRadius: '50%',
          background: 'rgba(0,0,0,0.35)', color: '#fff',
          border: 'none', cursor: 'pointer', fontSize: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="광고 닫기"
      >✕</button>
      <iframe
        srcDoc={makeHtml(ad)}
        style={{ width: ad.width, height: ad.height, border: 'none', display: 'block' }}
        scrolling="no"
        onLoad={() => onLoad?.(ad.height)}
      />
    </div>
  )
}
