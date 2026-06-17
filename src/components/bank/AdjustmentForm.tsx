import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  bankAccountId: string
  currentBalance: number
  userId: string
  onSuccess: () => void
}

export default function AdjustmentForm({ bankAccountId, currentBalance, userId, onSuccess }: Props) {
  const [newBalance, setNewBalance] = useState(String(currentBalance))
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const adjusted = Number(newBalance)
    const diff = adjusted - currentBalance // プラスなら増額、マイナスなら減額

    const [{ error: balErr }, { error: txErr }] = await Promise.all([
      supabase.from('bank_accounts').update({ balance: adjusted }).eq('id', bankAccountId),
      supabase.from('bank_transactions').insert({
        user_id: userId,
        bank_account_id: bankAccountId,
        type: 'adjustment',
        amount: diff,
        note: note || null,
      }),
    ])

    setLoading(false)
    if (balErr || txErr) {
      setError('残高調整に失敗しました。')
      return
    }
    setNote('')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">調整後の残高（円）</label>
        <input
          type="number"
          value={newBalance}
          onChange={(e) => setNewBalance(e.target.value)}
          className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
          min={0}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">調整理由（任意）</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="例：手数料引き落とし済み"
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '処理中...' : '残高を調整する'}
      </button>
    </form>
  )
}
