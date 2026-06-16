import { CreditCard, CardCharge, UpcomingWarning } from '@/types'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount)
}

export function getBillingDate(card: CreditCard, referenceDate = new Date()): Date {
  const year = referenceDate.getMonth() === 11
    ? referenceDate.getFullYear() + 1
    : referenceDate.getFullYear()
  const month = (referenceDate.getMonth() + 1) % 12
  const day = Math.min(card.billing_day, new Date(year, month + 1, 0).getDate())
  return new Date(year, month, day)
}

export function getDaysUntil(target: Date, from = new Date()): number {
  const diff = target.getTime() - new Date(from.toDateString()).getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getUpcomingWarnings(
  cards: CreditCard[],
  charges: CardCharge[]
): UpcomingWarning[] {
  const now = new Date()
  const warnings: UpcomingWarning[] = []

  for (const card of cards) {
    const billingDate = getBillingDate(card, now)
    const daysUntilBilling = getDaysUntil(billingDate, now)

    if (daysUntilBilling <= card.warning_days && daysUntilBilling >= 0) {
      const currentMonth = `${billingDate.getFullYear()}-${String(billingDate.getMonth() + 1).padStart(2, '0')}-01`
      const charge = charges.find(
        (c) => c.credit_card_id === card.id &&
          c.billing_year_month.startsWith(currentMonth.slice(0, 7)) &&
          !c.is_debited
      )
      if (charge) {
        warnings.push({ card, charge, billingDate, daysUntilBilling })
      }
    }
  }

  return warnings
}
