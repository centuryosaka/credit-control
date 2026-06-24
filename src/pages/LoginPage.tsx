import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { OAuthProvider, useAuth } from '@/contexts/AuthContext'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const { session, signIn, signUp, signInWithOAuth } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null)

  // ログイン済みの場合はダッシュボードにリダイレクト
  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError('メールアドレスまたはパスワードが正しくありません。')
    } else {
      const { error } = await signUp(email, password)
      if (error) setError(error.message)
      else setMessage('確認メールを送信しました。メールを確認してからログインしてください。')
    }

    setLoading(false)
  }

  async function handleOAuthClick(provider: OAuthProvider) {
    setError(null)
    setMessage(null)
    setOauthLoading(provider)

    const { error } = await signInWithOAuth(provider)
    if (error) {
      setError(error.message)
      setOauthLoading(null)
    }
    // 成功時はOAuthプロバイダーへリダイレクトされるためloadingはそのまま
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md">
        <h1 className="text-2xl font-bold text-blue-700 mb-2 text-center">Credit Control</h1>
        <p className="text-center text-gray-400 text-sm mb-8">クレジットカード残高管理</p>

        {/* ログイン / 会員登録 タブ */}
        <div className="flex border-b mb-6">
          {(['login', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setMessage(null) }}
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                mode === m
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {m === 'login' ? 'ログイン' : '会員登録'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="example@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="6文字以上"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '会員登録'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">または</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleOAuthClick('google')}
            disabled={oauthLoading !== null}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <GoogleIcon />
            {oauthLoading === 'google' ? '処理中...' : 'Googleでログイン'}
          </button>
          <button
            type="button"
            onClick={() => handleOAuthClick('yahoojp')}
            disabled={oauthLoading !== null}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <YahooJapanIcon />
            {oauthLoading === 'yahoojp' ? '処理中...' : 'Yahoo! JAPAN IDでログイン'}
          </button>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.08-1.81 2.72v2.26h2.92c1.71-1.57 2.69-3.89 2.69-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.95v2.33C2.44 15.98 5.48 18 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.71V4.96H.95A8.99 8.99 0 0 0 0 9c0 1.45.35 2.83.95 4.04l3.02-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.95 4.96l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}

function YahooJapanIcon() {
  return (
    <span className="flex items-center justify-center w-[18px] h-[18px] rounded-sm bg-[#FF0033] text-white text-[11px] font-bold leading-none">
      Y!
    </span>
  )
}
