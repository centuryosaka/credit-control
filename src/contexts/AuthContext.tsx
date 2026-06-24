import { createContext, useContext, useEffect, useState } from 'react'
import { Provider, Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type OAuthProvider = 'google' | 'yahoojp'

// SupabaseのProvider型は組み込みプロバイダーのみを列挙しているため、
// カスタムOIDCプロバイダー（custom:プレフィックス）はキャストして渡す
const OAUTH_PROVIDER_MAP: Record<OAuthProvider, Provider> = {
  google: 'google',
  yahoojp: 'custom:yahoojp' as Provider,
}

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithOAuth: (provider: OAuthProvider) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初回ロード時にセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // 認証状態の変化を監視（ログイン・ログアウト・トークン更新）
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  async function signInWithOAuth(provider: OAuthProvider) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: OAUTH_PROVIDER_MAP[provider],
      options: { redirectTo: window.location.origin },
    })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, signIn, signUp, signInWithOAuth, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// 認証コンテキストを取得するカスタムフック
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
