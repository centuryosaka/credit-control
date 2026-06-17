import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BankAccount, CreditCard } from '@/types'

interface Props {
  card: CreditCard
  bankAccounts: BankAccount[]
  onClose: () => void
  onSuccess: () => void
}

export default function EditCardModal({ card, bankAccounts, onClose, onSuccess }: Props) {
  const [name, setName] = useState(card.name)
  const [billingDay, setBillingDay] = useState(String(card.billing_day))
  const [bankAccountId, setBankAccountId] = useState(card.bank_account_id)
  const [warningDays, setWarningDays] = useState(String(card.warning_days))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase
      .from('credit_cards')
      .update({
        name,
        billing_day: Number(billingDay),
        bank_account_id: bankAccountId,
        warning_days: Number(warningDays),
      })
      .eq('id', card.id)

    setLoading(false)
    if (error) {
      setError('更新に失敗しました。')
      return
    }
    onSuccess()
    onClose()
  }

  return (
    // オーバーレイ（背景クリックで閉じる）
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* モーダル本体（クリックが親に伝わらないよう止める） */}
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-800">カード情報を修正</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">カード名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">引き落とし日（日）</label>
            <input
              type="number"
              value={billingDay}
              onChange={(e) => setBillingDay(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              min={1}
              max={31}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">引き落とし口座</label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            >
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              ワーニング日数（引き落とし日の何日前に通知するか）
            </label>
            <input
              type="number"
              value={warningDays}
              onChange={(e) => setWarningDays(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              min={1}
              max={30}
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {loading ? '保存中...' : '保存する'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
