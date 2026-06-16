'use client'

import { useState } from 'react'

interface Props {
  bankAccountId: string
  currentBalance: number
  onSuccess: () => void
}

export default function AdjustmentForm({ bankAccountId, currentBalance, onSuccess }: Props) {
  const [newBalance, setNewBalance] = useState(String(currentBalance))
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/bank/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankAccountId, newBalance: Number(newBalance), note }),
    })
    setLoading(false)
    if (res.ok) {
      setNote('')
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">調整後残高（円）</label>
        <input
          type="number"
          value={newBalance}
          onChange={(e) => setNewBalance(e.target.value)}
          className="border rounded px-3 py-2 w-full"
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
          className="border rounded px-3 py-2 w-full"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? '処理中...' : '残高を調整する'}
      </button>
    </form>
  )
}
