# credit-control

## プロジェクト概要

クレジットカード管理アプリ。銀行口座残高とカード引き落とし予定額を比較し、残高不足があればワーニングを出す自分専用ツール。

### 技術スタック
- **フロントエンド**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **バックエンド/DB**: Supabase (PostgreSQL)
- **Excel解析**: xlsx ライブラリ

## Git 運用ルール

**コードを変更するたびに、必ずGitHubへプッシュすること。**

### コミット & プッシュの手順

1. 変更をステージング
   ```bash
   git add <変更ファイル>
   ```

2. コミット（変更内容を簡潔に記述）
   ```bash
   git commit -m "変更内容の説明"
   ```

3. **即座にGitHubへプッシュ**
   ```bash
   git push origin <ブランチ名>
   ```

### ルール詳細

- コードを1箇所でも変更したら、作業完了を待たずにコミット＆プッシュを行う
- mainブランチへの直接プッシュは禁止。必ずfeatureブランチを経由してPRを作成する
- 作業開始時は必ず `git pull` で最新状態を取得する

### ブランチ命名規則

```
feature/<機能名>       # 新機能追加
fix/<バグ内容>         # バグ修正
refactor/<対象>        # リファクタリング
docs/<内容>            # ドキュメント変更
```

## ディレクトリ構造

```
credit-control/
├── app/                    # Next.js App Router
│   ├── page.tsx            # ダッシュボード（残高 vs カード使用額）
│   ├── bank/page.tsx       # 銀行口座管理
│   ├── cards/page.tsx      # カード管理
│   └── import/page.tsx     # Excelインポート
├── components/
│   ├── dashboard/          # BalanceSummary, WarningBanner
│   ├── bank/               # DepositForm, AdjustmentForm
│   └── cards/              # CardForm, CardChargeTable
├── lib/
│   ├── supabase/           # client.ts, server.ts
│   ├── excel.ts            # Excel解析
│   └── utils.ts            # 残高計算・日付ユーティリティ
├── types/index.ts          # 全型定義
└── supabase/migrations/    # DBマイグレーション
```

## DB設計

| テーブル | 用途 |
|---|---|
| `bank_accounts` | 銀行口座マスタ（残高） |
| `bank_transactions` | 残高変動履歴（入金・調整・引き落とし） |
| `credit_cards` | カードマスタ（引き落とし日・紐付け口座） |
| `card_charges` | カード引き落とし予定額（Excelインポート） |

## 環境変数

`.env.local` に以下を設定（`.env.local.example` 参照）：

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## コーディング規約

- コメントは原則不要。変数名・関数名で意図を表現する
- セキュリティ上の脆弱性（SQLインジェクション、XSS等）を絶対に混入させない
- デザイン: 問題なしはブルー系、残高不足は赤系
