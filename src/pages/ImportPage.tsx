import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CreditCard } from '@/types'
import { parseCardChargesFromExcel, ExcelCardRow } from '@/lib/excel'
import { formatCurrency } from '@/lib/utils'

export default function ImportPage() {
  const { user } = useAuth()
  const [cards, setCards] = useState<CreditCard[]>([])
  const [preview, setPreview] = useState<ExcelCardRow[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      supabase.from('credit_cards').select('*').then(({ data }) =>
        setCards((data ?? []) as CreditCard[]),
      )
    }
  }, [user])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const buffer = await file.arrayBuffer()
    const rows = parseCardChargesFromExcel(buffer)
    setPreview(rows)
    setStatus(null)
  }

  async function handleImport() {
    if (!user || preview.length === 0) return
    setStatus('インポート中...')

    for (const row of preview) {
      const card = cards.find((c) => c.name === row.cardName)
      if (!card) continue

      // "YYYY-MM" → "YYYY-MM-01" に正規化
      const billingYearMonth = row.billingYearMonth.length === 7
        ? `${row.billingYearMonth}-01`
        : row.billingYearMonth

      // 同じカード・同じ年月のデータは上書き（upsert）
      await supabase.from('card_charges').upsert(
        {
          user_id: user.id,
          credit_card_id: card.id,
          billing_year_month: billingYearMonth,
          amount: row.amount,
        },
        { onConflict: 'credit_card_id,billing_year_month' },
      )
    }

    setStatus(`${preview.length}件をインポートしました。`)
    setPreview([])
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Excelインポート</h1>

      <div className="bg-white rounded-xl border p-6 space-y-6">
        {/* Excelフォーマット説明 */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Excelファイルの形式</h2>
          <p className="text-sm text-gray-600 mb-2">
            1シート目に以下の列を用意してください：
          </p>
          <table className="text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-1.5 text-left">列名</th>
                <th className="border border-gray-200 px-3 py-1.5 text-left">内容</th>
                <th className="border border-gray-200 px-3 py-1.5 text-left">例</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-3 py-1.5">カード名</td>
                <td className="border border-gray-200 px-3 py-1.5">登録済みカード名と完全一致</td>
                <td className="border border-gray-200 px-3 py-1.5">三井住友カード</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-1.5">引き落とし年月</td>
                <td className="border border-gray-200 px-3 py-1.5">YYYY-MM 形式</td>
                <td className="border border-gray-200 px-3 py-1.5">2026-07</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-1.5">金額</td>
                <td className="border border-gray-200 px-3 py-1.5">引き落とし予定額（円・数値）</td>
                <td className="border border-gray-200 px-3 py-1.5">85000</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ファイル選択 */}
        <div>
          <label className="block text-sm font-medium mb-1">Excelファイルを選択</label>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFile}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* プレビューとインポートボタン */}
        {preview.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">プレビュー（{preview.length}件）</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-3 py-1.5 text-left">カード名</th>
                  <th className="border border-gray-200 px-3 py-1.5 text-left">引き落とし年月</th>
                  <th className="border border-gray-200 px-3 py-1.5 text-right">金額</th>
                  <th className="border border-gray-200 px-3 py-1.5 text-center">カードの照合</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => {
                  const matched = cards.some((c) => c.name === row.cardName)
                  return (
                    <tr key={i} className={matched ? '' : 'bg-red-50'}>
                      <td className="border border-gray-200 px-3 py-1.5">{row.cardName}</td>
                      <td className="border border-gray-200 px-3 py-1.5">{row.billingYearMonth}</td>
                      <td className="border border-gray-200 px-3 py-1.5 text-right">
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="border border-gray-200 px-3 py-1.5 text-center">
                        {matched ? (
                          <span className="text-green-600 font-medium">OK</span>
                        ) : (
                          <span className="text-red-600 font-medium">未登録カード</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <button
              onClick={handleImport}
              className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              インポートを実行する
            </button>
          </div>
        )}

        {status && (
          <p className="text-sm text-green-700 font-medium">{status}</p>
        )}
      </div>
    </div>
  )
}
