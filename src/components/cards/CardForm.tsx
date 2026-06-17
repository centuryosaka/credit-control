import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BankAccount } from '@/types'

interface Props {
  bankAccounts: BankAccount[]
  userId: string
  onSuccess: () => void
}

export default function CardForm({ bankAccounts, userId, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [closingDay, setClosingDay] = useState('')   // 締め日（空欄可）
  const [billingDay, setBillingDay] = useState('')
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id ?? '')
  const [warningDays, setWarningDays] = useState('3')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.from('credit_cards').insert({
      user_id: userId,
      name,
      closing_day: closingDay !== '' ? Number(closingDay) : null,
      billing_day: Number(billingDay),
      bank_account_id: bankAccountId,
      warning_days: Number(warningDays),
    })

    setLoading(false)
    if (error) {
      setError('カードの登録に失敗しました。')
      return
    }
    setName('')
    setClosingDay('')
    setBillingDay('')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">カード名</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="例：三井住友カード"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          締め日（日）
          <span className="ml-1 text-xs text-gray-400 font-normal">任意 ― 例：15日締めなら「15」</span>
        </label>
        <input
          type="number"
          value={closingDay}
          onChange={(e) => setClosingDay(e.target.value)}
          className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="未設定の場合は空欄"
          min={1}
          max={31}
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
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '処理中...' : 'カードを登録する'}
      </button>
    </form>
  )
}
