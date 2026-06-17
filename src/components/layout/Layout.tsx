import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

// 認証済みページ共通レイアウト
export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
