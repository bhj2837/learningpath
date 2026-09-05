'use client'
import Link from 'next/link'

function HeaderShell({ width, children }) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className={`${width} mx-auto px-6 h-16 flex items-center`}>{children}</div>
    </header>
  )
}

/** 대시보드용: 로고 + 사용자 + 로그아웃 */
export function AppHeader({ username, onLogout, width = 'max-w-6xl' }) {
  return (
    <HeaderShell width={width}>
      <div className="flex-1 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span aria-hidden="true" className="text-xl">
            🎯
          </span>
          <span className="font-bold text-gray-900">LearningPath</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">
            안녕하세요, <strong>{username}</strong>님
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </HeaderShell>
  )
}

/** 하위 페이지용: 뒤로가기 + 현재 페이지 제목 */
export function BackHeader({ title, href = '/dashboard', label = '대시보드', width = 'max-w-3xl' }) {
  return (
    <HeaderShell width={width}>
      <div className="flex items-center gap-4 min-w-0">
        <Link href={href} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
          <span aria-hidden="true">←</span> {label}
        </Link>
        <div aria-hidden="true" className="w-px h-5 bg-gray-200 flex-shrink-0" />
        <span className="font-semibold text-gray-900 truncate">{title}</span>
      </div>
    </HeaderShell>
  )
}
