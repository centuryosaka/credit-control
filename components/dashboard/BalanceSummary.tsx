import { DashboardSummary } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  summary: DashboardSummary
}

export default function BalanceSummary({ summary }: Props) {
  const { bankAccount, totalCharges, balance, isShortfall } = summary

  const rowClass = 'flex justify-between py-3 border-b last:border-0'
  const colorClass = isShortfall ? 'text-red-600' : 'text-blue-600'

  return (
    <div className={`rounded-xl border-2 ${isShortfall ? 'border-red-400 bg-red-50' : 'border-blue-300 bg-blue-50'} p-6`}>
      <h2 className="text-xl font-bold mb-4">{bankAccount.name}</h2>
      <div className="text-sm text-gray-600 space-y-0">
        <div className={rowClass}>
          <span>銀行残高</span>
          <span className="font-semibold text-gray-800">{formatCurrency(bankAccount.balance)}</span>
        </div>
        <div className={rowClass}>
          <span>カード引き落とし予定額（合計）</span>
          <span className="font-semibold text-gray-800">-{formatCurrency(totalCharges)}</span>
        </div>
        <div className={`${rowClass} text-base`}>
          <span className="font-bold">差引残高</span>
          <span className={`font-bold text-lg ${colorClass}`}>{formatCurrency(balance)}</span>
        </div>
      </div>
    </div>
  )
}
