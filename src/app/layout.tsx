import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'pochamap — 내 주변 길거리 음식 지도',
  description: '닭꼬치, 붕어빵, 타코야끼 위치를 지도에서 찾아보세요',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full antialiased" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        {/* AdSense 광고 승인 후 활성화
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4098269039875449"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        */}
        {children}
      </body>
    </html>
  )
}
