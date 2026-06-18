-- card_charges.billing_year_month を DATE から VARCHAR(7) に変更する
-- 既存の DATE 値（例: 2026-07-01）を YYYY-MM 形式（例: 2026-07）に変換
ALTER TABLE card_charges
  ALTER COLUMN billing_year_month TYPE VARCHAR(7)
  USING LEFT(billing_year_month::text, 7);
