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

// 月ウィンドウの中心オフセット範囲：-2〜5（左右に1ずつ広がり -3〜+6 の範囲をカバー）
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
  const [newDescription, setNewDescription] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  // ウィンドウに表示する3か月（中心 ± 1）
  const visibleMonths = useMemo(
    () => [-1, 0, 1].map(i => getMonthByOffset(windowOffset + i)),
    [windowOffset],
  )

  const billingYearMonth = useMemo(
    () => (selectedUsageYearMonth ? usageToBillingYearMonth(selectedUsageYearMonth) : ''),
    [selectedUsageYearMonth],
  )

  useEffect(() => {
    if (user) loadCards()
  }, [user])

  useEffect(() => {
    if (selectedCardId && billingYearMonth) loadItems()
  }, [selectedCardId, billingYearMonth])

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

  async function syncCardCharges(creditCardId: string, bym: string, latestItems: CardChargeItem[]) {
    const total = latestItems.reduce((sum, i) => sum + i.amount, 0)

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
    setEditingItemId(null)
  }

  async function handleDelete(itemId: string) {
    await supabase.from('card_charge_items').delete().eq('id', itemId)
    const updated = items.filter(i => i.id !== itemId)
    setItems(updated)
    await syncCardCharges(selectedCardId, billingYearMonth, updated)
  }

  function startEdit(item: CardChargeItem) {
    setEditingItemId(item.id)
    setEditDescription(item.description)
    setEditAmount(String(item.amount))
  }

  function shiftWindow(direction: -1 | 1) {
    const next = windowOffset + direction
    setWindowOffset(next)
    // スライドした方向の端の月を選択
    const newCenter = getMonthByOffset(next)
    setSelectedUsageYearMonth(newCenter.value)
  }

  const total = items.reduce((sum, i) => sum + i.amount, 0)
  const selectedCard = cards.find(c => c.id === selectedCardId)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">カード使用額入力</h1>

      {cards.length === 0 ? (
        <div className="bg-white rounded-xl border p-6 text-gray-500 text-sm">
          先にカード管理画面でカードを登録してください。
        </div>
      ) : (
        <>
          {/* カード・月選択 */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex flex-wrap gap-6 items-start">
              {/* カード選択 */}
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

              {/* 月選択スライダー */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-600">利用月</label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => shiftWindow(-1)}
                    disabled={windowOffset <= WINDOW_MIN}
                    className="w-8 h-9 flex items-center justify-center rounded-lg border text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ‹
                  </button>
                  {visibleMonths.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setSelectedUsageYearMonth(m.value)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${
                        m.value === selectedUsageYearMonth
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-gray-600 hover:bg-gray-100 border-gray-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                  <button
                    onClick={() => shiftWindow(1)}
                    disabled={windowOffset >= WINDOW_MAX}
                    className="w-8 h-9 flex items-center justify-center rounded-lg border text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-base font-semibold mb-4 text-gray-700">
              {selectedCard?.name}　／　{visibleMonths.find(m => m.value === selectedUsageYearMonth)?.label ?? selectedUsageYearMonth} 利用明細
            </h2>

            {items.length > 0 ? (
              <table className="w-full text-sm mb-5 border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="text-left py-2 font-medium">コメント</th>
                    <th className="text-right py-2 font-medium pr-4">金額</th>
                    <th className="w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item =>
                    editingItemId === item.id ? (
                      <tr key={item.id} className="border-b border-blue-100 bg-blue-50">
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
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 text-gray-700">{item.description}</td>
                        <td className="py-2 text-right pr-4 text-gray-700">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="py-2 text-center whitespace-nowrap">
                          <button
                            onClick={() => startEdit(item)}
                            className="text-blue-400 hover:text-blue-600 text-xs px-2 py-1 rounded hover:bg-blue-50 transition-colors"
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
                    <td className="py-3 font-bold text-gray-700">合計</td>
                    <td className="py-3 text-right pr-4 font-bold text-blue-600 text-base">
                      {formatCurrency(total)}
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
