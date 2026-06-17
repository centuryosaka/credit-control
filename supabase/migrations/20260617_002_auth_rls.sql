-- ============================================================
-- 認証対応・RLS付きテーブル定義
-- Supabase SQL Editorで実行してください
-- ============================================================

-- ============================================================
-- 銀行口座マスタ
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT          NOT NULL,
  balance    NUMERIC(12,0) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- 自分のデータのみ参照・更新・追加・削除できる
CREATE POLICY "bank_accounts_own" ON bank_accounts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 銀行残高変動履歴
-- type: initial（初期設定）/ deposit（追加入金）/ adjustment（調整）/ card_debit（引き落とし）
-- amount: 正=入金・増額、負=引き落とし・減額
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_transactions (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_account_id  UUID          NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  type             TEXT          NOT NULL CHECK (type IN ('initial','deposit','adjustment','card_debit')),
  amount           NUMERIC(12,0) NOT NULL,
  note             TEXT,
  transaction_date DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bank_transactions_own" ON bank_transactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- クレジットカードマスタ
-- billing_day : 引き落とし日（1〜31）
-- warning_days: 引き落とし日の何日前にワーニングを出すか（デフォルト3）
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_cards (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  billing_day     INTEGER     NOT NULL CHECK (billing_day BETWEEN 1 AND 31),
  bank_account_id UUID        NOT NULL REFERENCES bank_accounts(id),
  warning_days    INTEGER     NOT NULL DEFAULT 3,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_cards_own" ON credit_cards
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- カード引き落とし予定額（Excelインポート先）
-- billing_year_month: 引き落とし年月（YYYY-MM-01 で統一）
-- is_debited       : 引き落とし済みフラグ
-- ============================================================
CREATE TABLE IF NOT EXISTS card_charges (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_card_id     UUID          NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  billing_year_month DATE          NOT NULL,
  amount             NUMERIC(12,0) NOT NULL,
  is_debited         BOOLEAN       NOT NULL DEFAULT false,
  debited_at         TIMESTAMPTZ,
  note               TEXT,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (credit_card_id, billing_year_month)
);

ALTER TABLE card_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "card_charges_own" ON card_charges
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
