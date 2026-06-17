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

// 締め日が設定されているカードの利用期間（開始日・終了日）を計算
// 例：15締め→翌月10日払い の場合、7/10 引落 → 5/16〜6/15 利用分
export function getBillingPeriod(
  card: CreditCard,
  referenceDate = new Date(),
): { periodStart: Date; periodEnd: Date; billingDate: Date } | null {
  if (card.closing_day == null) return null

  const billingDate = getBillingDate(card, referenceDate)

  // 締め月 = 引き落とし月の前月
  const billingYear = billingDate.getFullYear()
  const billingMonth = billingDate.getMonth() // 0-indexed
  const closingYear = billingMonth === 0 ? billingYear - 1 : billingYear
  const closingMonth = billingMonth === 0 ? 11 : billingMonth - 1

  // 利用期間の終了日（締め日）
  const periodEnd = new Date(closingYear, closingMonth, card.closing_day)

  // 利用期間の開始日（前月締め日の翌日）
  const prevYear = closingMonth === 0 ? closingYear - 1 : closingYear
  const prevMonth = closingMonth === 0 ? 11 : closingMonth - 1
  const periodStart = new Date(prevYear, prevMonth, card.closing_day + 1)

  return { periodStart, periodEnd, billingDate }
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
