'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BankAccount } from '@/types'
import { formatCurrency } from '@/lib/utils'
import DepositForm from '@/components/bank/DepositForm'
import AdjustmentForm from '@/components/bank/AdjustmentForm'

export default function BankPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [initialBalance, setInitialBalance] = useState('')
  const [accountName, setAccountName] = useState('')
  const [activeTab, setActiveTab] = useState<'deposit' | 'adjust'>('deposit')
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('bank_accounts').select('*').order('created_at')
    setAccounts((data ?? []) as BankAccount[])
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('bank_accounts').insert({
      name: accountName,
      balance: Number(initialBalance),
    })
    await supabase.from('bank_transactions').insert({
      bank_account_id: (await supabase.from('bank_accounts').select('id').order('created_at', { ascending: false }).limit(1).single()).data?.id,
      type: 'initial',
      amount: Number(initialBalance),
      note: '初期残高設定',
    })
    setAccountName('')
    setInitialBalance('')
    load()
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">銀行口座管理</h1>

      {accounts.length === 0 && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">銀行口座を登録する</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">口座名</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                placeholder="例：メインバンク"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">初期残高（円）</label>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                min={0}
                required
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              登録する
            </button>
          </form>
        </div>
      )}

      {accounts.map((account) => (
        <div key={account.id} className="bg-white rounded-xl border p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{account.name}</h2>
            <span className="text-2xl font-bold text-blue-700">{formatCurrency(account.balance)}</span>
          </div>

          <div className="flex gap-4 border-b">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`pb-2 text-sm font-medium ${activeTab === 'deposit' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              追加入金
            </button>
            <button
              onClick={() => setActiveTab('adjust')}
              className={`pb-2 text-sm font-medium ${activeTab === 'adjust' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              残高調整
            </button>
          </div>

          {activeTab === 'deposit' && (
            <DepositForm bankAccountId={account.id} onSuccess={load} />
          )}
          {activeTab === 'adjust' && (
            <AdjustmentForm bankAccountId={account.id} currentBalance={account.balance} onSuccess={load} />
          )}
        </div>
      ))}
    </div>
  )
}
