'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (searchParams.get('tab') === 'register') setTab('register')
    if (localStorage.getItem('authToken')) router.replace('/dashboard')
  }, [searchParams, router])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let data
      if (tab === 'login') {
        data = await api.login(form.username, form.password)
      } else {
        data = await api.register(form.username, form.email, form.password)
      }
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('username', data.user.username)
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="text-3xl">🎯</span>
            <span className="font-bold text-2xl text-gray-900">LearningPath</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">AI 맞춤 학습 로드맵 플랫폼</p>
        </div>

        <div className="card shadow-xl">
          {/* Tab */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              aria-pressed={tab === 'login'}
              onClick={() => { setTab('login'); setError('') }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              로그인
            </button>
            <button
              type="button"
              aria-pressed={tab === 'register'}
              onClick={() => { setTab('register'); setError('') }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">아이디</label>
              <input
                id="username"
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="아이디를 입력하세요"
                className="input-field"
                required
                autoComplete="username"
              />
            </div>

            {tab === 'register' && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">이메일 (선택)</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="이메일을 입력하세요"
                  className="input-field"
                  autoComplete="email"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                // 백엔드 AUTH_PASSWORD_VALIDATORS의 MinimumLengthValidator(8)와 맞춘다.
                placeholder={tab === 'register' ? '8자 이상 입력하세요' : '비밀번호를 입력하세요'}
                className="input-field"
                required
                minLength={tab === 'register' ? 8 : undefined}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
              {tab === 'register' && (
                <p className="text-xs text-gray-400 mt-1.5">
                  8자 이상이며, 너무 흔하거나 숫자로만 이루어진 비밀번호는 사용할 수 없습니다.
                </p>
              )}
            </div>

            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg aria-hidden="true" className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  처리 중...
                </span>
              ) : tab === 'login' ? '로그인' : '회원가입'}
            </button>
          </form>

          {tab === 'login' && (
            <p className="text-center text-sm text-gray-500 mt-4">
              계정이 없으신가요?{' '}
              <button type="button" onClick={() => setTab('register')} className="text-indigo-600 font-medium hover:underline">
                회원가입
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400">로딩 중...</div></div>}>
      <AuthForm />
    </Suspense>
  )
}
