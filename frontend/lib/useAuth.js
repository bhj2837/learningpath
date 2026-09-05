'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, clearSession } from '@/lib/api'

/**
 * 토큰은 localStorage에만 있으므로 서버 렌더 시점에는 알 수 없다.
 * 따라서 판별은 항상 마운트 이후(useEffect)에 한다.
 */
const hasToken = () =>
  typeof window !== 'undefined' && !!localStorage.getItem('authToken')

/**
 * 로그인이 필요한 페이지에서 사용한다.
 * 토큰이 없으면 즉시 /auth로 보내고 checked를 false로 유지해
 * 보호된 화면이 한 프레임이라도 노출되지 않게 한다.
 */
export function useRequireAuth() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [username, setUsername] = useState('')

  useEffect(() => {
    if (!hasToken()) {
      router.replace('/auth')
      return
    }
    setUsername(localStorage.getItem('username') || '사용자')
    setChecked(true)
  }, [router])

  /** 401/403이면 세션을 정리하고 로그인 화면으로 보낸다. 처리했으면 true. */
  const handleAuthError = useCallback(
    (err) => {
      if (!err?.isAuthError) return false
      clearSession()
      router.replace('/auth')
      return true
    },
    [router]
  )

  const logout = useCallback(async () => {
    // 서버 토큰 폐기가 실패해도 로컬 세션은 정리한다.
    await api.logout().catch(() => {})
    clearSession()
    router.push('/')
  }, [router])

  return { checked, username, handleAuthError, logout }
}

/** 로그인 여부만 알면 되는 공개 페이지(랜딩, 인증)에서 사용한다. */
export function useIsLoggedIn() {
  const [loggedIn, setLoggedIn] = useState(false)
  useEffect(() => setLoggedIn(hasToken()), [])
  return loggedIn
}
