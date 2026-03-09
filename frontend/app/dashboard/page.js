'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

const CATEGORY_COLORS = {
  '개발': 'bg-blue-100 text-blue-700',
  '디자인': 'bg-pink-100 text-pink-700',
  '언어': 'bg-green-100 text-green-700',
}

const STATUS_INFO = {
  in_progress: { label: '진행중', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: '완료', color: 'bg-green-100 text-green-700' },
  paused: { label: '일시중지', color: 'bg-gray-100 text-gray-600' },
}

function RoadmapCard({ roadmap, onDelete }) {
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
    } catch {
      alert('삭제에 실패했습니다.')
      setDeleting(false)
    }
  }

  const categoryColor = CATEGORY_COLORS[roadmap.category] || 'bg-gray-100 text-gray-600'
  const statusInfo = STATUS_INFO[roadmap.status] || STATUS_INFO.in_progress

  return (
    <div
      onClick={() => router.push(`/roadmaps/${roadmap.id}`)}
      className="card hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-2 flex-wrap">
          <span className={`badge ${categoryColor}`}>{roadmap.category}</span>
          <span className={`badge ${statusInfo.color}`}>{statusInfo.label}</span>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all text-lg leading-none"
        >
          ×
        </button>
      </div>

      <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">{roadmap.title}</h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{roadmap.goal}</p>

      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
        <span>📅 {roadmap.duration_weeks}주</span>
        <span>⏱ 하루 {roadmap.daily_hours}시간</span>
        <span>📊 {roadmap.current_level}</span>
      </div>

      {totalChecks > 0 && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>진도</span>
            <span>{doneChecks}/{totalChecks} 완료</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
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
  const router = useRouter()
  const [roadmaps, setRoadmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) { router.push('/auth'); return }
    setUsername(localStorage.getItem('username') || '사용자')
    loadRoadmaps()
  }, [router])

  const loadRoadmaps = async () => {
    try {
      const data = await api.getRoadmaps()
      setRoadmaps(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      if (err.message?.includes('401') || err.message?.includes('인증')) {
        localStorage.removeItem('authToken')
        router.push('/auth')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await api.logout().catch(() => {})
    localStorage.removeItem('authToken')
    localStorage.removeItem('username')
    router.push('/')
  }

  const handleDelete = (id) => {
    setRoadmaps((prev) => prev.filter((r) => r.id !== id))
  }

  if (loading) {
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
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span className="font-bold text-gray-900">LearningPath</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">안녕하세요, <strong>{username}</strong>님</span>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              로그아웃
            </button>
          </div>
        </div>
      </header>

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

        {/* Roadmaps Grid */}
        {roadmaps.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">아직 학습 로드맵이 없어요</h3>
            <p className="text-gray-400 mb-6">AI로 나만의 첫 번째 학습 계획을 만들어보세요!</p>
            <Link href="/create" className="btn-primary">
              첫 로드맵 만들기 →
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((roadmap) => (
              <RoadmapCard key={roadmap.id} roadmap={roadmap} onDelete={handleDelete} />
            ))}
            {/* Add new card */}
            <Link
              href="/create"
              className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all cursor-pointer min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center text-2xl">+</div>
              <span className="text-sm font-medium">새 로드맵 추가</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
