'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BankAccount, CreditCard, CardCharge } from '@/types'
import CardForm from '@/components/cards/CardForm'
import CardChargeTable from '@/components/cards/CardChargeTable'

export default function CardsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])
  const [charges, setCharges] = useState<CardCharge[]>([])
  const supabase = createClient()

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

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">カード管理</h1>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">カードを登録する</h2>
        {accounts.length === 0 ? (
          <p className="text-gray-500 text-sm">
            先に<a href="/bank" className="text-blue-600 underline">銀行口座</a>を登録してください。
          </p>
        ) : (
          <CardForm bankAccounts={accounts} onSuccess={load} />
        )}
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">登録済みカード</h2>
        {cards.length === 0 ? (
          <p className="text-gray-400 text-sm">カードが登録されていません。</p>
        ) : (
          <ul className="space-y-2">
            {cards.map((card) => {
              const account = accounts.find((a) => a.id === card.bank_account_id)
              return (
                <li key={card.id} className="flex justify-between text-sm border-b pb-2">
                  <span className="font-medium">{card.name}</span>
                  <span className="text-gray-500">
                    毎月{card.billing_day}日引き落とし・{account?.name}・{card.warning_days}日前ワーニング
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">カード引き落とし予定一覧</h2>
        <CardChargeTable cards={cards} charges={charges} />
      </div>
    </div>
  )
}
