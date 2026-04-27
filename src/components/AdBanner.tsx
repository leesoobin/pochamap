'use client'

import { useEffect } from 'react'

declare global {
  interface Window { adsbygoogle: any[] }
}

export default function AdBanner() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {}
  }, [])

  return (
    <div className="w-full bg-white border-t border-gray-100 shrink-0" style={{ minHeight: 60 }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-4098269039875449"
        data-ad-slot="YOUR_SLOT_ID"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
