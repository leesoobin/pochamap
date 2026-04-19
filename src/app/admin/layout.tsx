import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full bg-gray-50">
      <aside className="w-52 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-700">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🏮</span>
            <div>
              <p className="font-bold text-sm">pochamap</p>
              <p className="text-xs text-gray-400">관리자</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link href="/admin/reports" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors">
            <span>📋</span> 제보 검토
          </Link>
          <Link href="/admin/locations" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors">
            <span>📍</span> 위치 관리
          </Link>
        </nav>
        <div className="p-3 border-t border-gray-700">
          <form action="/admin/logout" method="post">
            <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-700 transition-colors">
              로그아웃
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
