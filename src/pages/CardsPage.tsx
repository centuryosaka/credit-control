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
  // 修正モーダルで編集中のカード（nullなら非表示）
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)

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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">カード管理</h1>

      {/* カード登録フォーム */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">カードを登録する</h2>
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
            <CardForm bankAccounts={accounts} userId={user.id} onSuccess={load} />
          )
        )}
      </div>

      {/* 登録済みカード一覧 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">登録済みカード</h2>
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

      {/* 修正モーダル */}
      {editingCard && (
        <EditCardModal
          card={editingCard}
          bankAccounts={accounts}
          onClose={() => setEditingCard(null)}
          onSuccess={load}
        />
      )}

      {/* カード引き落とし予定一覧 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">カード引き落とし予定一覧</h2>
        <CardChargeTable cards={cards} charges={charges} />
      </div>
    </div>
  )
}
