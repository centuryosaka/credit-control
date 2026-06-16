import { createClient } from '@/lib/supabase/server'
import { BankAccount, CreditCard, CardCharge } from '@/types'
import { getUpcomingWarnings } from '@/lib/utils'
import BalanceSummary from '@/components/dashboard/BalanceSummary'
import WarningBanner from '@/components/dashboard/WarningBanner'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: accounts }, { data: cards }, { data: charges }] = await Promise.all([
    supabase.from('bank_accounts').select('*').order('created_at'),
    supabase.from('credit_cards').select('*'),
    supabase.from('card_charges').select('*').eq('is_debited', false),
  ])

  const bankAccounts = (accounts ?? []) as BankAccount[]
  const creditCards = (cards ?? []) as CreditCard[]
  const cardCharges = (charges ?? []) as CardCharge[]

  if (bankAccounts.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>銀行口座が登録されていません。</p>
        <a href="/bank" className="text-blue-600 underline mt-2 inline-block">銀行口座を設定する</a>
      </div>
    )
  }

  const summaries = bankAccounts.map((account) => {
    const relatedCards = creditCards.filter((c) => c.bank_account_id === account.id)
    const relatedCharges = cardCharges.filter((ch) =>
      relatedCards.some((c) => c.id === ch.credit_card_id)
    )
    const totalCharges = relatedCharges.reduce((sum, c) => sum + c.amount, 0)
    const balance = account.balance - totalCharges
    const warnings = getUpcomingWarnings(relatedCards, relatedCharges)

    return {
      bankAccount: account,
      totalCharges,
      balance,
      isShortfall: balance < 0,
      shortfallAmount: balance < 0 ? Math.abs(balance) : 0,
      upcomingWarnings: warnings,
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
