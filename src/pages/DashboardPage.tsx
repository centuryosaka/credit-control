import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { BankAccount, CreditCard, CardCharge } from '@/types'
import TimelineDashboard from '@/components/dashboard/TimelineDashboard'

export default function DashboardPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])
  const [charges, setCharges] = useState<CardCharge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) load()
  }, [user])

  async function load() {
    setLoading(true)
    const [{ data: a }, { data: c }, { data: ch }] = await Promise.all([
      supabase.from('bank_accounts').select('*').order('created_at'),
      supabase.from('credit_cards').select('*'),
      supabase.from('card_charges').select('*').eq('is_debited', false),
    ])
    setAccounts((a ?? []) as BankAccount[])
    setCards((c ?? []) as CreditCard[])
    setCharges((ch ?? []) as CardCharge[])
    setLoading(false)
  }

  if (loading) {
    return <div className="py-20 text-center text-gray-400">読み込み中...</div>
  }

  if (accounts.length === 0) {
    return (
      <div className="py-20 text-center text-gray-500">
        <p>銀行口座が登録されていません。</p>
        <Link to="/bank" className="text-blue-600 underline mt-2 inline-block">
          銀行口座を設定する
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">ホーム</h1>
      {accounts.map(account => (
        <TimelineDashboard
          key={account.id}
          account={account}
          cards={cards}
          charges={charges}
        />
      ))}
    </div>
  )
}
