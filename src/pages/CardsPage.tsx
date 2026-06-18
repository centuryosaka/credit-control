import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { BankAccount, CreditCard, CardCharge } from '@/types'
import CardForm from '@/components/cards/CardForm'
import CardChargeTable from '@/components/cards/CardChargeTable'
import EditCardModal from '@/components/cards/EditCardModal'

export default function CardsPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])
  const [charges, setCharges] = useState<CardCharge[]>([])
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (user) load()
  }, [user])

  async function load() {
    const [{ data: a }, { data: c }, { data: ch }] = await Promise.all([
      supabase.from('bank_accounts').select('*'),
      supabase.from('credit_cards').select('*').order('created_at'),
      supabase.from('card_charges').select('*').order('billing_year_month', { ascending: false }),
    ])
    setAccounts((a ?? []) as BankAccount[])
    setCards((c ?? []) as CreditCard[])
    setCharges((ch ?? []) as CardCharge[])
  }

  function handleAddSuccess() {
    setShowAddModal(false)
    load()
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">カード管理</h1>

      {/* カード引き落とし予定一覧 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">カード引き落とし予定一覧</h2>
        <CardChargeTable cards={cards} charges={charges} />
      </div>

      {/* 登録済みカード */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">登録済みカード</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ＋ カードを登録
          </button>
        </div>
        {cards.length === 0 ? (
          <p className="text-gray-400 text-sm">カードが登録されていません。</p>
        ) : (
          <ul className="space-y-2">
            {cards.map((card) => {
              const account = accounts.find((a) => a.id === card.bank_account_id)
              return (
                <li key={card.id} className="flex justify-between items-center text-sm border-b pb-2">
                  <div>
                    <span className="font-medium">{card.name}</span>
                    <span className="ml-3 text-gray-500">
                      {card.closing_day != null
                        ? `毎月${card.closing_day}日締め→${card.billing_day}日払い`
                        : `毎月${card.billing_day}日引き落とし`}
                      ・{account?.name}・{card.warning_days}日前ワーニング
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingCard(card)}
                    className="ml-4 text-xs text-blue-600 border border-blue-300 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors shrink-0"
                  >
                    修正
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* カード登録モーダル */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">カードを登録する</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            {accounts.length === 0 ? (
              <p className="text-gray-500 text-sm">
                先に
                <Link to="/bank" className="text-blue-600 underline mx-1">
                  銀行口座
                </Link>
                を登録してください。
              </p>
            ) : (
              user && (
                <CardForm bankAccounts={accounts} userId={user.id} onSuccess={handleAddSuccess} />
              )
            )}
          </div>
        </div>
      )}

      {/* カード修正モーダル */}
      {editingCard && (
        <EditCardModal
          card={editingCard}
          bankAccounts={accounts}
          onClose={() => setEditingCard(null)}
          onSuccess={load}
        />
      )}
    </div>
  )
}
