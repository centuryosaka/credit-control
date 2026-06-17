import { useState, useMemo } from 'react'
import { BankAccount, CreditCard, CardCharge } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface TimelineEntry {
  date: Date
  totalMonths: number
  yearMonth: string
  cardEntries: { card: CreditCard; charge: CardCharge | null; amount: number }[]
  totalDeductions: number
  openingBalance: number
  closingBalance: number
  needsTransfer: boolean
  transferAmount: number
}

interface Props {
  account: BankAccount
  cards: CreditCard[]
  charges: CardCharge[]
}

function md(d: Date) {
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function buildTimeline(
  account: BankAccount,
  cards: CreditCard[],
  charges: CardCharge[],
): TimelineEntry[] {
  const accountCards = cards.filter(c => c.bank_account_id === account.id)
  const today = new Date()
  const entriesMap = new Map<string, TimelineEntry>()

  for (let i = 0; i < 12; i++) {
    const rawMonth = today.getMonth() + i
    const year = today.getFullYear() + Math.floor(rawMonth / 12)
    const month = rawMonth % 12
    const yearMonth = `${year}-${String(month + 1).padStart(2, '0')}`

    for (const card of accountCards) {
      const date = new Date(year, month, card.billing_day)
      const dateKey = date.toISOString().slice(0, 10)

      if (!entriesMap.has(dateKey)) {
        entriesMap.set(dateKey, {
          date,
          totalMonths: year * 12 + month,
          yearMonth,
          cardEntries: [],
          totalDeductions: 0,
          openingBalance: 0,
          closingBalance: 0,
          needsTransfer: false,
          transferAmount: 0,
        })
      }

      const charge =
        charges.find(
          ch => ch.credit_card_id === card.id && ch.billing_year_month === yearMonth,
        ) ?? null

      const amount = charge?.amount ?? 0
      const entry = entriesMap.get(dateKey)!
      entry.cardEntries.push({ card, charge, amount })
      entry.totalDeductions += amount
    }
  }

  const entries = [...entriesMap.values()].sort((a, b) => a.date.getTime() - b.date.getTime())

  let balance = account.balance
  for (const e of entries) {
    e.openingBalance = balance
    e.closingBalance = balance - e.totalDeductions
    e.needsTransfer = e.closingBalance < 0
    e.transferAmount = e.needsTransfer ? Math.abs(e.closingBalance) : 0
    balance = e.closingBalance
  }

  return entries
}

export default function TimelineDashboard({ account, cards, charges }: Props) {
  const [monthOffset, setMonthOffset] = useState(0)
  const today = new Date()
  const WINDOW = 3

  const timeline = useMemo(
    () => buildTimeline(account, cards, charges),
    [account, cards, charges],
  )

  const rawStart = today.getMonth() + monthOffset
  const windowStartYear = today.getFullYear() + Math.floor(rawStart / 12)
  const windowStartMonth = ((rawStart % 12) + 12) % 12
  const windowStartTotalMonths = windowStartYear * 12 + windowStartMonth

  const windowEntries = timeline.filter(
    e => e.totalMonths >= windowStartTotalMonths && e.totalMonths < windowStartTotalMonths + WINDOW,
  )

  const windowOpeningBalance = windowEntries[0]?.openingBalance ?? account.balance
  const accountCards = cards.filter(c => c.bank_account_id === account.id)

  const windowLabel = `${windowStartYear}年${windowStartMonth + 1}月〜`

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">{account.name}</h2>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setMonthOffset(o => o - 1)}
            disabled={monthOffset <= -6}
            className="px-3 py-1 rounded-lg border hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            ← 前月
          </button>
          <span className="text-gray-500 min-w-[96px] text-center">{windowLabel}</span>
          <button
            onClick={() => setMonthOffset(o => o + 1)}
            disabled={monthOffset >= 9}
            className="px-3 py-1 rounded-lg border hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            翌月 →
          </button>
        </div>
      </div>

      {accountCards.length === 0 ? (
        <p className="text-gray-400 text-sm">この口座に紐付いたカードがありません。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 border border-gray-200 font-medium text-gray-600 min-w-[120px]">
                  項目
                </th>
                <th className="px-3 py-2 border border-gray-200 font-medium text-gray-600 text-center min-w-[110px]">
                  {monthOffset === 0 ? (
                    <>
                      現在
                      <br />
                      <span className="text-xs font-normal text-gray-400">（{md(today)}）</span>
                    </>
                  ) : (
                    <>
                      期首
                      <br />
                      <span className="text-xs font-normal text-gray-400">（{windowLabel}）</span>
                    </>
                  )}
                </th>
                {windowEntries.map(e => (
                  <th
                    key={e.date.toISOString()}
                    className="px-3 py-2 border border-gray-200 font-medium text-gray-600 text-center min-w-[110px]"
                  >
                    {md(e.date)}
                    <br />
                    <span className="text-xs font-normal text-gray-400">引落後</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 銀行残高 */}
              <tr className="bg-blue-50">
                <td className="px-3 py-2 border border-gray-200 font-medium text-gray-700">
                  銀行残高
                </td>
                <td className="px-3 py-2 border border-gray-200 text-right font-semibold text-gray-800">
                  {formatCurrency(windowOpeningBalance)}
                </td>
                {windowEntries.map(e => (
                  <td
                    key={e.date.toISOString()}
                    className="px-3 py-2 border border-gray-200 text-center text-gray-300"
                  >
                    ―
                  </td>
                ))}
              </tr>

              {/* カードごとの引き落とし額 */}
              {accountCards.map(card => (
                <tr key={card.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border border-gray-200 text-gray-600 pl-6">
                    {card.name}
                  </td>
                  <td className="px-3 py-2 border border-gray-200 text-center text-gray-300">
                    ―
                  </td>
                  {windowEntries.map(e => {
                    const ce = e.cardEntries.find(c => c.card.id === card.id)
                    return (
                      <td
                        key={e.date.toISOString()}
                        className="px-3 py-2 border border-gray-200 text-right"
                      >
                        {ce && ce.amount > 0 ? (
                          <span className="text-gray-700">{formatCurrency(ce.amount)}</span>
                        ) : (
                          <span className="text-gray-300">―</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* 引落後残高 */}
              <tr>
                <td className="px-3 py-2 border border-gray-200 font-bold text-gray-700">
                  引落後残高
                </td>
                <td className="px-3 py-2 border border-gray-200 text-right font-bold text-blue-600">
                  {formatCurrency(windowOpeningBalance)}
                </td>
                {windowEntries.map(e => (
                  <td
                    key={e.date.toISOString()}
                    className={`px-3 py-2 border border-gray-200 text-right font-bold ${
                      e.closingBalance < 0 ? 'text-red-600 bg-red-50' : 'text-blue-600'
                    }`}
                  >
                    {formatCurrency(e.closingBalance)}
                  </td>
                ))}
              </tr>

              {/* 振込要否 */}
              <tr>
                <td className="px-3 py-2 border border-gray-200 text-gray-600">振込要否</td>
                <td className="px-3 py-2 border border-gray-200 text-center text-gray-300">―</td>
                {windowEntries.map(e => (
                  <td
                    key={e.date.toISOString()}
                    className={`px-3 py-2 border border-gray-200 text-center font-medium ${
                      e.needsTransfer ? 'text-red-600' : 'text-gray-400'
                    }`}
                  >
                    {e.needsTransfer ? '要' : '不要'}
                  </td>
                ))}
              </tr>

              {/* 要振込額 */}
              <tr className="bg-yellow-50">
                <td className="px-3 py-2 border border-gray-200 font-medium text-gray-700">
                  要振込額
                </td>
                <td className="px-3 py-2 border border-gray-200 text-center text-gray-300">―</td>
                {windowEntries.map(e => (
                  <td
                    key={e.date.toISOString()}
                    className={`px-3 py-2 border border-gray-200 text-right font-semibold ${
                      e.needsTransfer ? 'text-red-600' : 'text-gray-300'
                    }`}
                  >
                    {e.needsTransfer ? formatCurrency(e.transferAmount) : '―'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
