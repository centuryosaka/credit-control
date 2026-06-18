CREATE TABLE IF NOT EXISTS card_charge_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  billing_year_month VARCHAR(7) NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE card_charge_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "card_charge_items_own" ON card_charge_items
  FOR ALL USING (auth.uid() = user_id);
