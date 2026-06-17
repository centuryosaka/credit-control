import { DashboardSummary } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  summary: DashboardSummary
}

export default function BalanceSummary({ summary }: Props) {
  const { bankAccount, totalCharges, balance, isShortfall, billingDates } = summary

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })

  // カードごとに "MM/DD〜MM/DD利用分 → MM/DD引落（カード名）" 形式で表示
  const md = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  const billingItems = billingDates.map(({ cardName, billingDate, periodStart, periodEnd }) =>
    periodStart && periodEnd
      ? `${md(periodStart)}〜${md(periodEnd)}利用分 → ${md(billingDate)}引落（${cardName}）`
      : `${md(billingDate)}引落（${cardName}）`
  )

  return (
    <div
      className={`rounded-xl border-2 p-6 ${
        isShortfall
          ? 'border-red-400 bg-red-50'
          : 'border-blue-300 bg-blue-50'
      }`}
    >
      <h2 className="text-xl font-bold mb-4 text-gray-800">{bankAccount.name}</h2>

      <div className="space-y-0 text-sm text-gray-600">
        <div className="flex justify-between py-3 border-b border-gray-200">
          <span>
            銀行残高
            <span className="ml-2 text-xs text-gray-400">（{today} 現在）</span>
          </span>
          <span className="font-semibold text-gray-800">{formatCurrency(bankAccount.balance)}</span>
        </div>
        <div className="py-3 border-b border-gray-200">
          <div className="flex justify-between">
            <span>カード引き落とし予定額（合計）</span>
            <span className="font-semibold text-gray-800">－{formatCurrency(totalCharges)}</span>
          </div>
          {billingItems.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {billingItems.map((item, i) => (
                <li key={i} className="text-xs text-gray-400 pl-2 before:content-['・'] before:mr-0.5">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-between py-3 text-base">
          <span className="font-bold">引落後残高</span>
          <span
            className={`font-bold text-lg ${
              isShortfall ? 'text-red-600' : 'text-blue-600'
            }`}
          >
            {formatCurrency(balance)}
          </span>
        </div>
      </div>
    </div>
  )
}
