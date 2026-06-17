// 銀行残高変動の種類
export type TransactionType = 'initial' | 'deposit' | 'adjustment' | 'card_debit'

// 銀行口座
export interface BankAccount {
  id: string
  user_id: string
  name: string
  balance: number
  created_at: string
  updated_at: string
}

// 銀行残高変動履歴
export interface BankTransaction {
  id: string
  user_id: string
  bank_account_id: string
  type: TransactionType
  amount: number
  note: string | null
  transaction_date: string
  created_at: string
}

// クレジットカード
export interface CreditCard {
  id: string
  user_id: string
  name: string
  billing_day: number
  bank_account_id: string
  warning_days: number
  created_at: string
}

// カード引き落とし予定額
export interface CardCharge {
  id: string
  user_id: string
  credit_card_id: string
  billing_year_month: string
  amount: number
  is_debited: boolean
  debited_at: string | null
  note: string | null
  created_at: string
}

// ダッシュボード表示用サマリー
export interface DashboardSummary {
  bankAccount: BankAccount
  totalCharges: number
  balance: number
  isShortfall: boolean
  shortfallAmount: number
  upcomingWarnings: UpcomingWarning[]
  // 口座に紐づく各カードの次回引き落とし日
  billingDates: { cardName: string; date: Date }[]
}

// 引き落とし直前のワーニング情報
export interface UpcomingWarning {
  card: CreditCard
  charge: CardCharge
  billingDate: Date
  daysUntilBilling: number
}
