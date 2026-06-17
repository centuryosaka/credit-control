import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  bankAccountId: string
  currentBalance: number
  userId: string
  onSuccess: () => void
}

export default function DepositForm({ bankAccountId, currentBalance, userId, onSuccess }: Props) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const depositAmount = Number(amount)
    const newBalance = currentBalance + depositAmount

    // 残高更新と履歴記録を並列実行
    const [{ error: balErr }, { error: txErr }] = await Promise.all([
      supabase.from('bank_accounts').update({ balance: newBalance }).eq('id', bankAccountId),
      supabase.from('bank_transactions').insert({
        user_id: userId,
        bank_account_id: bankAccountId,
        type: 'deposit',
        amount: depositAmount,
        note: note || null,
      }),
    ])

    setLoading(false)
    if (balErr || txErr) {
      setError('入金処理に失敗しました。')
      return
    }
    setAmount('')
    setNote('')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">入金額（円）</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
          min={1}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">メモ（任意）</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="例：給与振込"
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '処理中...' : '入金する'}
      </button>
    </form>
  )
}
