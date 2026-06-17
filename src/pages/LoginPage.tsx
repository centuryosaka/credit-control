import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const { session, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      </div>
    </div>
  )
}
