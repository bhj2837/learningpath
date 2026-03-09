'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('authToken')) {
      setIsLoggedIn(true)
    }
  }, [])

  const features = [
    {
      icon: '🤖',
      title: 'AI 맞춤 생성',
      desc: 'Claude AI가 목표, 수준, 기간을 분석해 최적화된 커리큘럼을 자동으로 설계합니다.',
    },
    {
      icon: '📅',
      title: '주차별 커리큘럼',
      desc: '매 주차마다 학습 내용, 추천 자료, 실습 프로젝트, 체크리스트를 제공합니다.',
    },
    {
      icon: '✅',
      title: '진도 추적',
      desc: '체크리스트로 학습 완료 여부를 기록하고 나만의 학습 현황을 한눈에 확인하세요.',
    },
  ]

  const steps = [
    { num: '01', title: '목표 입력', desc: '배우고 싶은 것, 기간, 하루 학습 시간, 현재 수준을 입력하세요.' },
    { num: '02', title: 'AI 생성', desc: 'Claude AI가 30초 안에 맞춤형 주차별 학습 계획을 만들어드립니다.' },
    { num: '03', title: '학습 시작', desc: '자료를 따라 공부하고 체크리스트를 체크하며 성장해나가세요.' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="font-bold text-xl text-gray-900">LearningPath</span>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-primary text-sm"
              >
                대시보드
              </button>
            ) : (
              <>
                <Link href="/auth" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  로그인
                </Link>
                <Link href="/auth?tab=register" className="btn-primary text-sm">
                  무료로 시작하기
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span>✨</span>
            <span>Claude AI 기반 개인 맞춤 학습</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
            AI가 만드는<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              나만의 학습 로드맵
            </span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            목표와 기간만 입력하면 30초 만에 주차별 학습 계획, 추천 자료,
            실습 프로젝트를 자동으로 생성해드립니다.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth?tab=register" className="btn-primary px-8 py-3 text-base">
              지금 무료로 시작하기 →
            </Link>
            <Link href="/auth" className="btn-secondary px-8 py-3 text-base">
              로그인
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4">회원가입 무료 · 신용카드 불필요</p>
        </div>
      </section>

      {/* Preview Card */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border border-indigo-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">1</div>
              <div>
                <div className="font-semibold text-gray-900">React 기초 이해하기</div>
                <div className="text-sm text-gray-500">예상 시간: 10시간</div>
              </div>
              <div className="ml-auto badge bg-green-100 text-green-700">완료</div>
            </div>
            <div className="space-y-2 mb-6">
              {['React 기본 개념 이해', 'JSX 문법 익히기', '컴포넌트 직접 만들어보기'].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${i < 2 ? 'bg-indigo-600 text-white' : 'border-2 border-gray-200'}`}>
                    {i < 2 ? '✓' : ''}
                  </div>
                  <span className={`text-sm ${i < 2 ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <span className="badge bg-blue-100 text-blue-700">📹 React 공식 문서</span>
              <span className="badge bg-purple-100 text-purple-700">💻 프로젝트: Counter 앱</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">왜 LearningPath인가요?</h2>
            <p className="text-gray-500 text-lg">막막한 학습 계획, AI에게 맡기세요</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="card hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">3단계로 완성되는 학습 계획</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl font-bold text-indigo-100 mb-3">{s.num}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">지금 바로 시작해보세요</h2>
          <p className="text-indigo-100 mb-8 text-lg">무료로 가입하고 첫 번째 학습 로드맵을 만들어보세요.</p>
          <Link href="/auth?tab=register" className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold py-3 px-8 rounded-xl transition-all duration-200 inline-block">
            무료로 시작하기 →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span className="font-bold text-gray-700">LearningPath</span>
          </div>
          <p className="text-sm text-gray-400">Powered by Claude AI</p>
        </div>
      </footer>
    </div>
  )
}
