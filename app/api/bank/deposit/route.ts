import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { bankAccountId, amount, note } = await req.json()
  const supabase = await createClient()

  const { data: account, error: fetchErr } = await supabase
    .from('bank_accounts')
    .select('balance')
    .eq('id', bankAccountId)
    .single()

  if (fetchErr || !account) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const newBalance = account.balance + Number(amount)

  const [{ error: txErr }, { error: balErr }] = await Promise.all([
    supabase.from('bank_transactions').insert({
      bank_account_id: bankAccountId,
      type: 'deposit',
      amount: Number(amount),
      note: note || null,
    }),
    supabase.from('bank_accounts').update({ balance: newBalance }).eq('id', bankAccountId),
  ])

  if (txErr || balErr) return NextResponse.json({ error: 'failed' }, { status: 500 })

  return NextResponse.json({ balance: newBalance })
}
