import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { name, billingDay, bankAccountId, warningDays } = await req.json()
  const supabase = await createClient()

  const { error } = await supabase.from('credit_cards').insert({
    name,
    billing_day: Number(billingDay),
    bank_account_id: bankAccountId,
    warning_days: Number(warningDays),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
