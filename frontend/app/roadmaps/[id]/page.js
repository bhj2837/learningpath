'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

const RESOURCE_ICONS = {
  video: '📹',
  text: '📄',
  course: '🎓',
  book: '📚',
  github: '💻',
  article: '📰',
}

const STATUS_OPTIONS = [
  { value: 'in_progress', label: '진행중', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'completed', label: '완료', color: 'bg-green-100 text-green-700' },
  { value: 'paused', label: '일시중지', color: 'bg-gray-100 text-gray-600' },
]

function WeekCard({ week, onChecklistToggle }) {
  const [open, setOpen] = useState(week.week_number === 1)
  const total = week.checklists?.length || 0
  const done = week.checklists?.filter((c) => c.is_completed).length || 0
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="card overflow-hidden">
      {/* Week Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 text-left"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 ${done === total && total > 0 ? 'bg-green-500' : 'bg-indigo-600'}`}>
          {done === total && total > 0 ? '✓' : week.week_number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{week.title}</h3>
            {total > 0 && (
              <span className="badge bg-indigo-50 text-indigo-600 flex-shrink-0">{done}/{total}</span>
            )}
          </div>
          {total > 0 && (
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${done === total ? 'bg-green-500' : 'bg-indigo-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-gray-400">⏱ {week.estimated_hours}h</span>
          <span className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      {/* Week Content */}
      {open && (
        <div className="mt-5 pt-5 border-t border-gray-100 space-y-5">
          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed">{week.description}</p>

          {/* Resources */}
          {week.resources?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">학습 자료</h4>
              <div className="space-y-2">
                {week.resources.map((res, i) => (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-gray-50 hover:bg-indigo-50 rounded-xl px-4 py-3 transition-colors group"
                  >
                    <span className="text-xl">{RESOURCE_ICONS[res.type] || '🔗'}</span>
                    <span className="text-sm text-gray-700 group-hover:text-indigo-700 flex-1 min-w-0 truncate">
                      {res.title}
                    </span>
                    <span className="text-gray-300 group-hover:text-indigo-400 text-xs">→</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Project */}
          {week.project_suggestion && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-purple-600">💡</span>
                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">실습 프로젝트</span>
              </div>
              <p className="text-sm text-purple-800">{week.project_suggestion}</p>
            </div>
          )}

          {/* Checklists */}
          {week.checklists?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">체크리스트</h4>
              <div className="space-y-2">
                {week.checklists.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onChecklistToggle(week.id, item.id)}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all text-left ${
                      item.is_completed ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      item.is_completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-indigo-400'
                    }`}>
                      {item.is_completed && <span className="text-xs font-bold">✓</span>}
                    </div>
                    <span className={`text-sm transition-all ${item.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {item.content}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function RoadmapDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('authToken')) { router.push('/auth'); return }
    loadRoadmap()
  }, [params.id, router])

  const loadRoadmap = async () => {
    try {
      const data = await api.getRoadmap(params.id)
      setRoadmap(data)
    } catch {
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleChecklistToggle = async (weekId, checklistId) => {
    try {
      const updated = await api.toggleChecklist(checklistId)
      setRoadmap((prev) => ({
        ...prev,
        weeks: prev.weeks.map((w) =>
          w.id === weekId
            ? {
                ...w,
                checklists: w.checklists.map((c) =>
                  c.id === checklistId ? { ...c, is_completed: updated.is_completed } : c
                ),
              }
            : w
        ),
      }))
    } catch {
      alert('체크리스트 업데이트에 실패했습니다.')
    }
  }

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true)
    try {
      const updated = await api.updateRoadmapStatus(roadmap.id, newStatus)
      setRoadmap((prev) => ({ ...prev, status: updated.status }))
    } catch {
      alert('상태 변경에 실패했습니다.')
    } finally {
      setStatusLoading(false)
    }
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

  if (!roadmap) return null

  // Stats
  const totalChecks = roadmap.weeks?.reduce((s, w) => s + (w.checklists?.length || 0), 0) || 0
  const doneChecks = roadmap.weeks?.reduce((s, w) => s + (w.checklists?.filter((c) => c.is_completed).length || 0), 0) || 0
  const overallProgress = totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) : 0

  const currentStatusInfo = STATUS_OPTIONS.find((s) => s.value === roadmap.status) || STATUS_OPTIONS[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
            ← 대시보드
          </Link>
          <div className="w-px h-5 bg-gray-200" />
          <span className="font-semibold text-gray-900 truncate">{roadmap.title}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Roadmap Info */}
        <div className="card mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="badge bg-indigo-100 text-indigo-700">{roadmap.category}</span>
                <span className="badge bg-purple-100 text-purple-700">{roadmap.current_level}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{roadmap.title}</h1>
              <p className="text-gray-500 text-sm">{roadmap.goal}</p>
            </div>

            {/* Status */}
            <div className="flex-shrink-0">
              <select
                value={roadmap.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusLoading}
                className={`text-sm font-medium px-4 py-2 rounded-xl border-0 cursor-pointer ${currentStatusInfo.color} outline-none`}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-5 py-4 border-t border-b border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{roadmap.duration_weeks}</div>
              <div className="text-xs text-gray-400 mt-0.5">총 주차</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{roadmap.daily_hours}</div>
              <div className="text-xs text-gray-400 mt-0.5">하루 시간</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{overallProgress}%</div>
              <div className="text-xs text-gray-400 mt-0.5">완료율</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>전체 진도</span>
              <span>{doneChecks} / {totalChecks} 항목 완료</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${overallProgress === 100 ? 'bg-green-500' : 'bg-indigo-600'}`}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Weeks */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">주차별 커리큘럼</h2>
          {roadmap.weeks?.length > 0 ? (
            roadmap.weeks.map((week) => (
              <WeekCard key={week.id} week={week} onChecklistToggle={handleChecklistToggle} />
            ))
          ) : (
            <div className="card text-center py-10 text-gray-400">
              <p>주차 정보가 없습니다.</p>
            </div>
          )}
        </div>

        {/* Completion Message */}
        {overallProgress === 100 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-bold text-green-800 mb-1">모든 학습을 완료했어요!</h3>
            <p className="text-green-600 text-sm">축하합니다! 목표를 달성했습니다.</p>
          </div>
        )}
      </main>
    </div>
  )
}
