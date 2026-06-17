import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { BankAccount } from '@/types'
import { formatCurrency } from '@/lib/utils'
import DepositForm from '@/components/bank/DepositForm'
import AdjustmentForm from '@/components/bank/AdjustmentForm'

type Tab = 'deposit' | 'adjust'

export default function BankPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [accountName, setAccountName] = useState('')
  const [initialBalance, setInitialBalance] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('deposit')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) load()
  }, [user])

  async function load() {
    const { data } = await supabase.from('bank_accounts').select('*').order('created_at')
    setAccounts((data ?? []) as BankAccount[])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    const { data: newAccount } = await supabase
      .from('bank_accounts')
      .insert({ user_id: user.id, name: accountName, balance: Number(initialBalance) })
      .select()
      .single()

    if (newAccount) {
      // 初期残高を変動履歴に記録
      await supabase.from('bank_transactions').insert({
        user_id: user.id,
        bank_account_id: newAccount.id,
        type: 'initial',
        amount: Number(initialBalance),
        note: '初期残高設定',
      })
    }

    setAccountName('')
    setInitialBalance('')
    setLoading(false)
    load()
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">銀行口座管理</h1>

      {/* 口座未登録時は登録フォームを表示 */}
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
                className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                min={0}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '登録中...' : '登録する'}
            </button>
          </form>
        </div>
      )}

      {/* 登録済み口座の操作パネル */}
      {accounts.map((account) => (
        <div key={account.id} className="bg-white rounded-xl border p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{account.name}</h2>
            <span className="text-2xl font-bold text-blue-700">
              {formatCurrency(account.balance)}
            </span>
          </div>

          {/* 追加入金 / 残高調整 タブ */}
          <div className="flex gap-4 border-b">
            {(['deposit', 'adjust'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab === 'deposit' ? '追加入金' : '残高調整'}
              </button>
            ))}
          </div>

          {activeTab === 'deposit' && user && (
            <DepositForm
              bankAccountId={account.id}
              currentBalance={account.balance}
              userId={user.id}
              onSuccess={load}
            />
          )}
          {activeTab === 'adjust' && user && (
            <AdjustmentForm
              bankAccountId={account.id}
              currentBalance={account.balance}
              userId={user.id}
              onSuccess={load}
            />
          )}
        </div>
      ))}
    </div>
  )
}
