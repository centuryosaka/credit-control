'use client'

import { useState } from 'react'
import { BankAccount } from '@/types'

interface Props {
  bankAccounts: BankAccount[]
  onSuccess: () => void
}

export default function CardForm({ bankAccounts, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [billingDay, setBillingDay] = useState('')
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id ?? '')
  const [warningDays, setWarningDays] = useState('3')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, billingDay: Number(billingDay), bankAccountId, warningDays: Number(warningDays) }),
    })
    setLoading(false)
    if (res.ok) {
      setName('')
      setBillingDay('')
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">カード名</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded px-3 py-2 w-full"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">引き落とし日</label>
        <input
          type="number"
          value={billingDay}
          onChange={(e) => setBillingDay(e.target.value)}
          className="border rounded px-3 py-2 w-full"
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
          className="border rounded px-3 py-2 w-full"
          required
        >
          {bankAccounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">ワーニング日数（引き落とし日の何日前）</label>
        <input
          type="number"
          value={warningDays}
          onChange={(e) => setWarningDays(e.target.value)}
          className="border rounded px-3 py-2 w-full"
          min={1}
          max={30}
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '処理中...' : 'カードを登録する'}
      </button>
    </form>
  )
}
