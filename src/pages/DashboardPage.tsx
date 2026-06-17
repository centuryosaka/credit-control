import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { BankAccount, CreditCard, CardCharge } from '@/types'
import { getUpcomingWarnings } from '@/lib/utils'
import BalanceSummary from '@/components/dashboard/BalanceSummary'
import WarningBanner from '@/components/dashboard/WarningBanner'

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
      // 未引き落とし分のみ取得してワーニング・残高計算に使用
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

  // 口座ごとにサマリーを計算
  const summaries = accounts.map((account) => {
    const relatedCards = cards.filter((c) => c.bank_account_id === account.id)
    const relatedCharges = charges.filter((ch) =>
      relatedCards.some((c) => c.id === ch.credit_card_id),
    )
    const totalCharges = relatedCharges.reduce((sum, c) => sum + c.amount, 0)
    const balance = account.balance - totalCharges

    return {
      bankAccount: account,
      totalCharges,
      balance,
      isShortfall: balance < 0,
      shortfallAmount: balance < 0 ? Math.abs(balance) : 0,
      upcomingWarnings: getUpcomingWarnings(relatedCards, relatedCharges),
    }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
      {summaries.map((summary) => (
        <div key={summary.bankAccount.id} className="space-y-4">
          <BalanceSummary summary={summary} />
          <WarningBanner
            warnings={summary.upcomingWarnings}
            isShortfall={summary.isShortfall}
            shortfallAmount={summary.shortfallAmount}
          />
        </div>
      ))}
    </div>
  )
}
