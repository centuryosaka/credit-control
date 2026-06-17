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
            <th className="px-4 py-2 border border-gray-200">カード名</th>
            <th className="px-4 py-2 border border-gray-200">引き落とし年月</th>
            <th className="px-4 py-2 border border-gray-200 text-right">金額</th>
            <th className="px-4 py-2 border border-gray-200 text-center">状態</th>
          </tr>
        </thead>
        <tbody>
          {charges.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                データがありません。Excelからインポートしてください。
              </td>
            </tr>
          )}
          {charges.map((charge) => (
            <tr
              key={charge.id}
              className={charge.is_debited ? 'bg-gray-50 text-gray-400' : ''}
            >
              <td className="px-4 py-2 border border-gray-200">
                {cardMap[charge.credit_card_id]?.name ?? '－'}
              </td>
              <td className="px-4 py-2 border border-gray-200">
                {charge.billing_year_month.slice(0, 7)}
              </td>
              <td className="px-4 py-2 border border-gray-200 text-right">
                {formatCurrency(charge.amount)}
              </td>
              <td className="px-4 py-2 border border-gray-200 text-center">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    charge.is_debited
                      ? 'bg-gray-200 text-gray-500'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {charge.is_debited ? '引き落とし済' : '未引き落とし'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
