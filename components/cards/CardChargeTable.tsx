import { CardCharge, CreditCard } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  cards: CreditCard[]
  charges: CardCharge[]
}

export default function CardChargeTable({ cards, charges }: Props) {
  const cardMap = Object.fromEntries(cards.map((c) => [c.id, c]))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-4 py-2 border">カード名</th>
            <th className="px-4 py-2 border">引き落とし年月</th>
            <th className="px-4 py-2 border text-right">金額</th>
            <th className="px-4 py-2 border text-center">引き落とし済み</th>
          </tr>
        </thead>
        <tbody>
          {charges.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                データがありません。Excelからインポートしてください。
              </td>
            </tr>
          )}
          {charges.map((charge) => (
            <tr key={charge.id} className={charge.is_debited ? 'bg-gray-50 text-gray-400' : ''}>
              <td className="px-4 py-2 border">{cardMap[charge.credit_card_id]?.name ?? '-'}</td>
              <td className="px-4 py-2 border">
                {charge.billing_year_month.slice(0, 7)}
              </td>
              <td className="px-4 py-2 border text-right">{formatCurrency(charge.amount)}</td>
              <td className="px-4 py-2 border text-center">
                {charge.is_debited ? '済' : '未'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
