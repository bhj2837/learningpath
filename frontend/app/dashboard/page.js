'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { AppHeader } from '@/app/components/Header'
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR, statusInfo } from '@/lib/constants'
import { useRequireAuth } from '@/lib/useAuth'

function RoadmapCard({ roadmap, onDelete, onError }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  // 완료된 체크리스트 비율 계산
  const totalChecks = roadmap.weeks?.reduce((sum, w) => sum + (w.checklists?.length || 0), 0) || 0
  const doneChecks = roadmap.weeks?.reduce(
    (sum, w) => sum + (w.checklists?.filter((c) => c.is_completed).length || 0),
    0
  ) || 0
  const progress = totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) : 0

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirm(`"${roadmap.title}" 로드맵을 삭제하시겠습니까?`)) return
    setDeleting(true)
    try {
      await api.deleteRoadmap(roadmap.id)
      onDelete(roadmap.id)
    } catch (err) {
      onError(err)
      setDeleting(false)
    }
  }

  const categoryColor = CATEGORY_COLORS[roadmap.category] || DEFAULT_CATEGORY_COLOR
  const status = statusInfo(roadmap.status)

  return (
    <div
      onClick={() => router.push(`/roadmaps/${roadmap.id}`)}
      className="card hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-2 flex-wrap">
          <span className={`badge ${categoryColor}`}>{roadmap.category}</span>
          <span className={`badge ${status.color}`}>{status.label}</span>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`${roadmap.title} 로드맵 삭제`}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-300 hover:text-red-500 transition-all text-lg leading-none"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">{roadmap.title}</h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{roadmap.goal}</p>

      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
        <span>
          <span aria-hidden="true">📅</span> {roadmap.duration_weeks}주
        </span>
        <span>
          <span aria-hidden="true">⏱</span> 하루 {roadmap.daily_hours}시간
        </span>
        <span>
          <span aria-hidden="true">📊</span> {roadmap.current_level}
        </span>
      </div>

      {totalChecks > 0 && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>진도</span>
            <span>{doneChecks}/{totalChecks} 완료</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${roadmap.title} 진도`}
            className="w-full bg-gray-100 rounded-full h-2"
          >
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-indigo-600 mt-1 font-medium">{progress}%</p>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { checked, username, handleAuthError, logout } = useRequireAuth()
  const [roadmaps, setRoadmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!checked) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await api.getRoadmaps()
        if (!cancelled) setRoadmaps(Array.isArray(data) ? data : data.results || [])
      } catch (err) {
        if (handleAuthError(err) || cancelled) return
        setError(err.message || '로드맵을 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [checked, handleAuthError])

  const handleDelete = (id) => {
    setRoadmaps((prev) => prev.filter((r) => r.id !== id))
  }

  const handleCardError = (err) => {
    if (handleAuthError(err)) return
    setError(err.message || '삭제에 실패했습니다.')
  }

  if (!checked || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500">로드맵 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader username={username} onLogout={logout} />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">내 학습 로드맵</h1>
            <p className="text-gray-500 text-sm mt-1">총 {roadmaps.length}개의 로드맵</p>
          </div>
          <Link href="/create" className="btn-primary flex items-center gap-2">
            <span>+</span>
            <span>새 로드맵 생성</span>
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-6"
          >
            {error}
          </div>
        )}

        {/* Roadmaps Grid */}
        {roadmaps.length === 0 ? (
          <div className="text-center py-20">
            <div aria-hidden="true" className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">아직 학습 로드맵이 없어요</h3>
            <p className="text-gray-400 mb-6">AI로 나만의 첫 번째 학습 계획을 만들어보세요!</p>
            <Link href="/create" className="btn-primary">
              첫 로드맵 만들기 →
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((roadmap) => (
              <RoadmapCard
                key={roadmap.id}
                roadmap={roadmap}
                onDelete={handleDelete}
                onError={handleCardError}
              />
            ))}
            {/* Add new card */}
            <Link
              href="/create"
              className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all cursor-pointer min-h-[200px]"
            >
              <div aria-hidden="true" className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center text-2xl">+</div>
              <span className="text-sm font-medium">새 로드맵 추가</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
