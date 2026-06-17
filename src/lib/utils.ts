import { CreditCard, CardCharge, UpcomingWarning } from '@/types'

// 金額を日本円表記にフォーマット
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount)
}

// 指定カードの次回引き落とし日を計算
export function getBillingDate(card: CreditCard, referenceDate = new Date()): Date {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth() // 0-indexed
  // 今月の引き落とし日
  const thisMonthBilling = new Date(year, month, card.billing_day)
  // 今月の引き落とし日を過ぎていたら来月を返す
  if (thisMonthBilling <= referenceDate) {
    return new Date(year, month + 1, card.billing_day)
  }
  return thisMonthBilling
}

// 対象日までの残り日数を計算
export function getDaysUntil(target: Date, from = new Date()): number {
  const fromDate = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const diff = target.getTime() - fromDate.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ワーニング対象カードと引き落とし情報を抽出
export function getUpcomingWarnings(
  cards: CreditCard[],
  charges: CardCharge[],
): UpcomingWarning[] {
  const now = new Date()
  const warnings: UpcomingWarning[] = []

  for (const card of cards) {
    const billingDate = getBillingDate(card, now)
    const daysUntilBilling = getDaysUntil(billingDate, now)

    if (daysUntilBilling <= card.warning_days && daysUntilBilling >= 0) {
      const ym = `${billingDate.getFullYear()}-${String(billingDate.getMonth() + 1).padStart(2, '0')}`
      const charge = charges.find(
        (c) =>
          c.credit_card_id === card.id &&
          c.billing_year_month.startsWith(ym) &&
          !c.is_debited,
      )
      if (charge) {
        warnings.push({ card, charge, billingDate, daysUntilBilling })
      }
    }
  }

  return warnings
}
