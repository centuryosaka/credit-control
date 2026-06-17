import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import BankPage from '@/pages/BankPage'
import CardsPage from '@/pages/CardsPage'
import ImportPage from '@/pages/ImportPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 未ログイン時のログイン画面 */}
          <Route path="/login" element={<LoginPage />} />

          {/* 認証済みページ（未ログインはログイン画面にリダイレクト） */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="bank" element={<BankPage />} />
            <Route path="cards" element={<CardsPage />} />
            <Route path="import" element={<ImportPage />} />
          </Route>

          {/* 未定義パスはダッシュボードへ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
