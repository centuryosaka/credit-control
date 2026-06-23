import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CreditCard, CardChargeItem } from '@/types'
import { formatCurrency } from '@/lib/utils'

function getMonthByOffset(offsetFromToday: number): { value: string; label: string } {
  const today = new Date()
  const d = new Date(today.getFullYear(), today.getMonth() + offsetFromToday, 1)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  return {
    value: `${year}-${String(month).padStart(2, '0')}`,
    label: `${year}年${month}月`,
  }
}

function usageToBillingYearMonth(usageYearMonth: string): string {
  const [y, m] = usageYearMonth.split('-').map(Number)
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getPeriodLabel(card: CreditCard, billingYearMonth: string): string {
  const [year, month] = billingYearMonth.split('-').map(Number)
  const billingMonth0 = month - 1

  if (card.closing_day == null) {
    return `${year}年${month}月${card.billing_day}日 引き落とし`
  }

  const closingYear = billingMonth0 === 0 ? year - 1 : year
  const closingMonth0 = billingMonth0 === 0 ? 11 : billingMonth0 - 1
  const periodEnd = new Date(closingYear, closingMonth0, card.closing_day)

  const prevYear = closingMonth0 === 0 ? closingYear - 1 : closingYear
  const prevMonth0 = closingMonth0 === 0 ? 11 : closingMonth0 - 1
  const periodStart = new Date(prevYear, prevMonth0, card.closing_day + 1)

  const fmt = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`
  return `${fmt(periodStart)}〜${fmt(periodEnd)}利用分 → ${year}年${month}月${card.billing_day}日払い`
}

const WINDOW_MIN = -2
const WINDOW_MAX = 5

export default function ChargesPage() {
  const { user } = useAuth()
  const [cards, setCards] = useState<CreditCard[]>([])
  const [items, setItems] = useState<CardChargeItem[]>([])
  const [selectedCardId, setSelectedCardId] = useState('')
  const [selectedUsageYearMonth, setSelectedUsageYearMonth] = useState(
    () => getMonthByOffset(0).value,
  )
  const [windowOffset, setWindowOffset] = useState(0)
  const [monthTotals, setMonthTotals] = useState<Record<string, number>>({})
  const [newDescription, setNewDescription] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  const visibleMonths = useMemo(
    () => [-1, 0, 1].map(i => getMonthByOffset(windowOffset + i)),
    [windowOffset],
  )

  const billingYearMonth = useMemo(
    () => (selectedUsageYearMonth ? usageToBillingYearMonth(selectedUsageYearMonth) : ''),
    [selectedUsageYearMonth],
  )

  // チェック済み明細の合計（card_charges に連携する値）
  const confirmedTotal = items.filter(i => i.is_confirmed).reduce((sum, i) => sum + i.amount, 0)

  useEffect(() => {
    if (user) loadCards()
  }, [user])

  useEffect(() => {
    if (selectedCardId && billingYearMonth) loadItems()
  }, [selectedCardId, billingYearMonth])

  useEffect(() => {
    if (selectedCardId) loadMonthTotals()
  }, [selectedCardId, windowOffset])

  async function loadCards() {
    const { data } = await supabase.from('credit_cards').select('*').order('created_at')
    const loaded = (data ?? []) as CreditCard[]
    setCards(loaded)
    if (loaded.length > 0 && !selectedCardId) setSelectedCardId(loaded[0].id)
  }

  async function loadItems() {
    const { data } = await supabase
      .from('card_charge_items')
      .select('*')
      .eq('credit_card_id', selectedCardId)
      .eq('billing_year_month', billingYearMonth)
      .order('created_at')
    setItems((data ?? []) as CardChargeItem[])
  }

  async function loadMonthTotals() {
    const billingMonths = visibleMonths.map(m => usageToBillingYearMonth(m.value))
    const { data } = await supabase
      .from('card_charges')
      .select('billing_year_month, amount')
      .eq('credit_card_id', selectedCardId)
      .in('billing_year_month', billingMonths)

    const totals: Record<string, number> = {}
    for (const m of visibleMonths) {
      const bym = usageToBillingYearMonth(m.value)
      const found = (data ?? []).find(c => c.billing_year_month === bym)
      totals[m.value] = found?.amount ?? 0
    }
    setMonthTotals(totals)
  }

  // チェック済み合計のみ card_charges に反映
  async function syncCardCharges(creditCardId: string, bym: string, latestItems: CardChargeItem[]) {
    const total = latestItems.filter(i => i.is_confirmed).reduce((sum, i) => sum + i.amount, 0)

    const { data: existing } = await supabase
      .from('card_charges')
      .select('id')
      .eq('credit_card_id', creditCardId)
      .eq('billing_year_month', bym)
      .maybeSingle()

    if (total === 0) {
      if (existing) await supabase.from('card_charges').delete().eq('id', existing.id)
    } else if (existing) {
      await supabase.from('card_charges').update({ amount: total }).eq('id', existing.id)
    } else {
      await supabase.from('card_charges').insert({
        user_id: user!.id,
        credit_card_id: creditCardId,
        billing_year_month: bym,
        amount: total,
        is_debited: false,
      })
    }
  }

  function refreshButtonTotal(latestItems: CardChargeItem[]) {
    const total = latestItems.filter(i => i.is_confirmed).reduce((sum, i) => sum + i.amount, 0)
    setMonthTotals(prev => ({ ...prev, [selectedUsageYearMonth]: total }))
  }

  async function handleToggleConfirmed(itemId: string) {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    const { data, error: err } = await supabase
      .from('card_charge_items')
      .update({ is_confirmed: !item.is_confirmed })
      .eq('id', itemId)
      .select()
      .single()

    if (err || !data) return

    const updated = items.map(i => (i.id === itemId ? (data as CardChargeItem) : i))
    setItems(updated)
    await syncCardCharges(selectedCardId, billingYearMonth, updated)
    refreshButtonTotal(updated)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newDescription.trim() || !newAmount) return
    setError(null)
    setAdding(true)

    const { data, error: err } = await supabase
      .from('card_charge_items')
      .insert({
        user_id: user!.id,
        credit_card_id: selectedCardId,
        billing_year_month: billingYearMonth,
        description: newDescription.trim(),
        amount: Number(newAmount),
        is_confirmed: true,
      })
      .select()
      .single()

    setAdding(false)
    if (err || !data) {
      setError('追加に失敗しました。')
      return
    }

    const updated = [...items, data as CardChargeItem]
    setItems(updated)
    await syncCardCharges(selectedCardId, billingYearMonth, updated)
    refreshButtonTotal(updated)
    setNewDescription('')
    setNewAmount('')
  }

  async function handleEdit(itemId: string) {
    if (!editDescription.trim() || !editAmount) return
    setError(null)

    const { data, error: err } = await supabase
      .from('card_charge_items')
      .update({ description: editDescription.trim(), amount: Number(editAmount) })
      .eq('id', itemId)
      .select()
      .single()

    if (err || !data) {
      setError('更新に失敗しました。')
      return
    }

    const updated = items.map(i => (i.id === itemId ? (data as CardChargeItem) : i))
    setItems(updated)
    await syncCardCharges(selectedCardId, billingYearMonth, updated)
    refreshButtonTotal(updated)
    setEditingItemId(null)
  }

  async function handleDelete(itemId: string) {
    await supabase.from('card_charge_items').delete().eq('id', itemId)
    const updated = items.filter(i => i.id !== itemId)
    setItems(updated)
    await syncCardCharges(selectedCardId, billingYearMonth, updated)
    refreshButtonTotal(updated)
  }

  function startEdit(item: CardChargeItem) {
    setEditingItemId(item.id)
    setEditDescription(item.description)
    setEditAmount(String(item.amount))
  }

  function shiftWindow(direction: -1 | 1) {
    const next = windowOffset + direction
    setWindowOffset(next)
    setSelectedUsageYearMonth(getMonthByOffset(next).value)
  }

  const selectedCard = cards.find(c => c.id === selectedCardId)
  const selectedMonthLabel =
    visibleMonths.find(m => m.value === selectedUsageYearMonth)?.label ?? selectedUsageYearMonth

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">カード使用額入力</h1>

      {cards.length === 0 ? (
        <div className="bg-white rounded-xl border p-4 sm:p-6 text-gray-500 text-sm">
          先にカード管理画面でカードを登録してください。
        </div>
      ) : (
        <>
          {/* カード・月選択 */}
          <div className="bg-white rounded-xl border p-4 sm:p-6">
            <div className="flex flex-wrap gap-4 sm:gap-6 items-start">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">カード</label>
                <select
                  value={selectedCardId}
                  onChange={e => setSelectedCardId(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {cards.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="min-w-0 max-w-full">
                <label className="block text-sm font-medium mb-2 text-gray-600">利用月</label>
                <div className="flex items-center gap-1 max-w-full overflow-x-auto pb-1">
                  <button
                    onClick={() => shiftWindow(-1)}
                    disabled={windowOffset <= WINDOW_MIN}
                    className="shrink-0 w-7 sm:w-8 h-12 sm:h-14 flex items-center justify-center rounded-lg border text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg"
                  >
                    ‹
                  </button>
                  {visibleMonths.map(m => {
                    const isSelected = m.value === selectedUsageYearMonth
                    const total = monthTotals[m.value] ?? 0
                    return (
                      <button
                        key={m.value}
                        onClick={() => setSelectedUsageYearMonth(m.value)}
                        className={`shrink-0 flex flex-col items-center px-2 sm:px-4 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors whitespace-nowrap min-w-[76px] sm:min-w-[100px] h-12 sm:h-14 justify-center ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'text-gray-600 hover:bg-gray-100 border-gray-300'
                        }`}
                      >
                        <span>{m.label}</span>
                        <span className={`text-[10px] sm:text-xs mt-0.5 font-normal ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                          {total > 0 ? formatCurrency(total) : '―'}
                        </span>
                      </button>
                    )
                  })}
                  <button
                    onClick={() => shiftWindow(1)}
                    disabled={windowOffset >= WINDOW_MAX}
                    className="shrink-0 w-7 sm:w-8 h-12 sm:h-14 flex items-center justify-center rounded-lg border text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>

            {selectedCard && billingYearMonth && (
              <p className="mt-3 text-xs text-gray-400">
                {getPeriodLabel(selectedCard, billingYearMonth)}
              </p>
            )}
          </div>

          {/* 明細一覧 + 入力フォーム */}
          <div className="bg-white rounded-xl border p-4 sm:p-6">
            <h2 className="text-base font-semibold mb-4 text-gray-700">
              {selectedCard?.name}　／　{selectedMonthLabel} 利用明細
            </h2>

            {items.length > 0 ? (
              <table className="w-full text-sm mb-5 border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="w-8 py-2"></th>
                    <th className="text-left py-2 font-medium">コメント</th>
                    <th className="text-right py-2 font-medium pr-4">金額</th>
                    <th className="w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item =>
                    editingItemId === item.id ? (
                      <tr key={item.id} className="border-b border-blue-100 bg-blue-50">
                        <td className="py-2 pl-1"></td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={editDescription}
                            onChange={e => setEditDescription(e.target.value)}
                            className="border rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="number"
                            value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                            min={1}
                            className="border rounded px-2 py-1 w-full text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </td>
                        <td className="py-2 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(item.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingItemId(null)}
                            className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors ml-1"
                          >
                            取消
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={item.id}
                        className={`border-b transition-colors ${
                          item.is_confirmed
                            ? 'bg-blue-50 hover:bg-blue-100'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-2 pl-1 text-center">
                          <input
                            type="checkbox"
                            checked={item.is_confirmed}
                            onChange={() => handleToggleConfirmed(item.id)}
                            className="w-4 h-4 accent-blue-600 cursor-pointer"
                          />
                        </td>
                        <td className={`py-2 ${item.is_confirmed ? 'text-blue-700' : 'text-gray-400'}`}>
                          {item.description}
                        </td>
                        <td className={`py-2 text-right pr-4 ${item.is_confirmed ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="py-2 text-center whitespace-nowrap">
                          <button
                            onClick={() => startEdit(item)}
                            className="text-blue-400 hover:text-blue-600 text-xs px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                          >
                            修正
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors ml-1"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300">
                    <td></td>
                    <td className="py-3 font-bold text-gray-700">確認済み合計</td>
                    <td className="py-3 text-right pr-4 font-bold text-blue-600 text-base">
                      {formatCurrency(confirmedTotal)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="text-gray-400 text-sm mb-5">
                まだ明細がありません。下のフォームから追加してください。
              </p>
            )}

            {/* 追加フォーム */}
            <form onSubmit={handleAdd} className="flex gap-2 items-end flex-wrap border-t border-gray-100 pt-4">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-gray-500 mb-1">コメント</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="例：コンビニ、スーパー、電気店"
                  className="border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
              <div className="w-36">
                <label className="block text-xs text-gray-500 mb-1">金額（円）</label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  placeholder="15000"
                  min={1}
                  className="border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={adding}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors font-medium"
              >
                {adding ? '追加中...' : '＋ 追加'}
              </button>
            </form>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>
        </>
      )}
    </div>
  )
}
