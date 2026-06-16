export type TransactionType = 'initial' | 'deposit' | 'adjustment' | 'card_debit'

export interface BankAccount {
  id: string
  name: string
  balance: number
  created_at: string
  updated_at: string
}

export interface BankTransaction {
  id: string
  bank_account_id: string
  type: TransactionType
  amount: number
  note: string | null
  transaction_date: string
  created_at: string
}

export interface CreditCard {
  id: string
  name: string
  billing_day: number
  bank_account_id: string
  warning_days: number
  created_at: string
}

export interface CardCharge {
  id: string
  credit_card_id: string
  billing_year_month: string
  amount: number
  is_debited: boolean
  debited_at: string | null
  note: string | null
  created_at: string
}

export interface DashboardSummary {
  bankAccount: BankAccount
  totalCharges: number
  balance: number
  isShortfall: boolean
  shortfallAmount: number
  upcomingWarnings: UpcomingWarning[]
}

export interface UpcomingWarning {
  card: CreditCard
  charge: CardCharge
  billingDate: Date
  daysUntilBilling: number
}
