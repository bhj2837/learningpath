'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

const CATEGORIES = ['개발', '디자인', '언어', '비즈니스', '기타']
const DURATIONS = [2, 4, 6, 8, 12, 16]
const DAILY_HOURS = [0.5, 1, 1.5, 2, 3, 4]
const LEVELS = ['입문', '초급', '중급', '고급']

const GOAL_EXAMPLES = [
  'React로 웹 개발 시작하기',
  'Python으로 데이터 분석 배우기',
  '영어 비즈니스 회화 마스터',
  'UI/UX 디자인 기초 익히기',
  'Django로 백엔드 API 개발',
]

export default function CreatePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    goal: '',
    category: '개발',
    duration_weeks: 4,
    daily_hours: 2,
    current_level: '초급',
  })
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('authToken')) router.push('/auth')
  }, [router])

  // 로딩 중 메시지 순환
  useEffect(() => {
    if (!loading) return
    const messages = [
      '🤖 AI가 목표를 분석하고 있어요...',
      '📚 최적의 학습 순서를 설계 중이에요...',
      '🎯 주차별 커리큘럼을 구성하고 있어요...',
      '🔗 학습 자료를 선별하고 있어요...',
      '✅ 체크리스트를 작성하고 있어요...',
      '🎉 거의 완성됐어요! 조금만 기다려주세요...',
    ]
    let i = 0
    setLoadingMsg(messages[0])
    const interval = setInterval(() => {
      i = (i + 1) % messages.length
      setLoadingMsg(messages[i])
    }, 5000)
    return () => clearInterval(interval)
  }, [loading])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: ['duration_weeks'].includes(name) ? Number(value) : ['daily_hours'].includes(name) ? Number(value) : value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.goal.trim()) { setError('학습 목표를 입력해주세요.'); return }
    setLoading(true)
    setError('')
    try {
      const roadmap = await api.generateRoadmap(form)
      router.push(`/roadmaps/${roadmap.id}`)
    } catch (err) {
      setError(err.message || '로드맵 생성에 실패했습니다. 다시 시도해주세요.')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-3xl">🤖</div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">로드맵 생성 중</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-2">{loadingMsg}</p>
          <p className="text-xs text-gray-400">약 30초 정도 소요됩니다</p>
          <div className="mt-6 bg-white rounded-2xl p-4 border border-indigo-100">
            <p className="text-sm text-gray-600 font-medium">"{form.goal}"</p>
            <div className="flex gap-2 mt-2 justify-center flex-wrap">
              <span className="badge bg-indigo-100 text-indigo-700">{form.category}</span>
              <span className="badge bg-purple-100 text-purple-700">{form.duration_weeks}주</span>
              <span className="badge bg-blue-100 text-blue-700">{form.current_level}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
            ← 대시보드
          </Link>
          <div className="w-px h-5 bg-gray-200" />
          <span className="font-semibold text-gray-900">새 학습 로드맵 생성</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">어떤 걸 배우고 싶으세요?</h1>
          <p className="text-gray-500">목표를 입력하면 AI가 맞춤 커리큘럼을 30초 만에 만들어드려요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Goal */}
          <div className="card">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              🎯 학습 목표 <span className="text-red-400">*</span>
            </label>
            <textarea
              name="goal"
              value={form.goal}
              onChange={handleChange}
              placeholder="예: React를 배워서 웹 개발을 시작하고 싶어요"
              className="input-field resize-none"
              rows={3}
              required
            />
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs text-gray-400 mr-1">예시:</span>
              {GOAL_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setForm({ ...form, goal: ex })}
                  className="text-xs bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Category & Level */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <label className="block text-sm font-semibold text-gray-700 mb-3">📂 카테고리</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      form.category === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <label className="block text-sm font-semibold text-gray-700 mb-3">📊 현재 수준</label>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setForm({ ...form, current_level: level })}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      form.current_level === level
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Duration & Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                📅 총 학습 기간: <span className="text-indigo-600">{form.duration_weeks}주</span>
              </label>
              <input
                type="range"
                name="duration_weeks"
                min="2"
                max="16"
                step="2"
                value={form.duration_weeks}
                onChange={handleChange}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>2주</span>
                <span>16주</span>
              </div>
            </div>

            <div className="card">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                ⏱ 하루 학습 시간: <span className="text-indigo-600">{form.daily_hours}시간</span>
              </label>
              <input
                type="range"
                name="daily_hours"
                min="0.5"
                max="4"
                step="0.5"
                value={form.daily_hours}
                onChange={handleChange}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.5시간</span>
                <span>4시간</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-indigo-700 mb-3">📋 입력 요약</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-gray-500">목표</span>
              <span className="text-gray-800 font-medium">{form.goal || '미입력'}</span>
              <span className="text-gray-500">카테고리</span>
              <span className="text-gray-800">{form.category}</span>
              <span className="text-gray-500">기간</span>
              <span className="text-gray-800">{form.duration_weeks}주 ({form.duration_weeks * 7 * form.daily_hours}시간 예상)</span>
              <span className="text-gray-500">하루 학습</span>
              <span className="text-gray-800">{form.daily_hours}시간</span>
              <span className="text-gray-500">수준</span>
              <span className="text-gray-800">{form.current_level}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          <button type="submit" className="btn-primary w-full py-4 text-base">
            🤖 AI로 로드맵 생성하기
          </button>
        </form>
      </main>
    </div>
  )
}
