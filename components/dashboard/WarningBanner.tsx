import { UpcomingWarning } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  warnings: UpcomingWarning[]
  isShortfall: boolean
  shortfallAmount: number
}

export default function WarningBanner({ warnings, isShortfall, shortfallAmount }: Props) {
  if (!isShortfall && warnings.length === 0) return null

  return (
    <div className="space-y-3">
      {isShortfall && (
        <div className="bg-red-50 border border-red-400 text-red-800 rounded-lg p-4">
          <p className="font-bold text-lg">残高不足のワーニング</p>
          <p className="mt-1">
            引き落とし予定額に対して <span className="font-bold">{formatCurrency(shortfallAmount)}</span> 不足しています。
            至急銀行口座へ振り込んでください。
          </p>
        </div>
      )}
      {warnings.map(({ card, charge, billingDate, daysUntilBilling }) => (
        <div key={charge.id} className="bg-yellow-50 border border-yellow-400 text-yellow-800 rounded-lg p-4">
          <p className="font-semibold">
            {card.name} の引き落とし日まであと {daysUntilBilling} 日
            （{billingDate.toLocaleDateString('ja-JP')}）
          </p>
          <p className="mt-1">
            引き落とし予定額: <span className="font-bold">{formatCurrency(charge.amount)}</span>
          </p>
        </div>
      ))}
    </div>
  )
}
