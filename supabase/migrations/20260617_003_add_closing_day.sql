-- credit_cards テーブルに締め日（closing_day）を追加
-- 例：15締め10日払い → closing_day=15, billing_day=10
-- 未設定（NULL）の場合は従来通り引き落とし日のみ表示
ALTER TABLE credit_cards
  ADD COLUMN IF NOT EXISTS closing_day INTEGER CHECK (closing_day BETWEEN 1 AND 31);
