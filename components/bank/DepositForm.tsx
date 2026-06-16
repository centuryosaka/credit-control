'use client'

import { useState } from 'react'

interface Props {
  bankAccountId: string
  onSuccess: () => void
}

export default function DepositForm({ bankAccountId, onSuccess }: Props) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/bank/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankAccountId, amount: Number(amount), note }),
    })
    setLoading(false)
    if (res.ok) {
      setAmount('')
      setNote('')
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">入金額（円）</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border rounded px-3 py-2 w-full"
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
          className="border rounded px-3 py-2 w-full"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '処理中...' : '入金する'}
      </button>
    </form>
  )
}
