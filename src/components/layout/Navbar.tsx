import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const NAV_LINKS = [
  { href: '/', label: 'ダッシュボード' },
  { href: '/bank', label: '銀行口座' },
  { href: '/cards', label: 'カード管理' },
  { href: '/charges', label: '使用額入力' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex items-center gap-6">
      <span className="font-bold text-lg mr-2">Credit Control</span>

      {NAV_LINKS.map(({ href, label }) => (
        <Link
          key={href}
          to={href}
          className={`text-sm transition-colors hover:text-blue-200 ${
            pathname === href ? 'underline font-semibold' : ''
          }`}
        >
          {label}
        </Link>
      ))}

      {/* ログインユーザー情報とログアウトボタン */}
      <div className="ml-auto flex items-center gap-4">
        <span className="text-xs text-blue-200 hidden sm:block">{user?.email}</span>
        <button
          onClick={signOut}
          className="text-sm bg-blue-800 hover:bg-blue-900 px-3 py-1.5 rounded transition-colors"
        >
          ログアウト
        </button>
      </div>
    </nav>
  )
}
