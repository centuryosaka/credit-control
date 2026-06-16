'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CreditCard } from '@/types'
import { parseCardChargesFromExcel } from '@/lib/excel'
import { formatCurrency } from '@/lib/utils'

export default function ImportPage() {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [preview, setPreview] = useState<{ cardName: string; billingYearMonth: string; amount: number }[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('credit_cards').select('*').then(({ data }) => setCards((data ?? []) as CreditCard[]))
  }, [])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const buffer = await file.arrayBuffer()
    const rows = parseCardChargesFromExcel(buffer)
    setPreview(rows)
    setStatus(null)
  }

  async function handleImport() {
    if (preview.length === 0) return
    setStatus('インポート中...')

    for (const row of preview) {
      const card = cards.find((c) => c.name === row.cardName)
      if (!card) continue

      const billingYearMonth = row.billingYearMonth.length === 7
        ? `${row.billingYearMonth}-01`
        : row.billingYearMonth

      await supabase.from('card_charges').upsert({
        credit_card_id: card.id,
        billing_year_month: billingYearMonth,
        amount: row.amount,
      }, { onConflict: 'credit_card_id,billing_year_month' })
    }

    setStatus(`${preview.length}件をインポートしました。`)
    setPreview([])
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Excelインポート</h1>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Excelファイルの形式</h2>
          <p className="text-sm text-gray-600">1シート目に以下の列を用意してください：</p>
          <table className="mt-2 text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-1">列名</th>
                <th className="border px-3 py-1">内容</th>
                <th className="border px-3 py-1">例</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-3 py-1">カード名</td>
                <td className="border px-3 py-1">登録済みカード名と一致させる</td>
                <td className="border px-3 py-1">三井住友カード</td>
              </tr>
              <tr>
                <td className="border px-3 py-1">引き落とし年月</td>
                <td className="border px-3 py-1">YYYY-MM 形式</td>
                <td className="border px-3 py-1">2026-07</td>
              </tr>
              <tr>
                <td className="border px-3 py-1">金額</td>
                <td className="border px-3 py-1">引き落とし予定額（円）</td>
                <td className="border px-3 py-1">85000</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Excelファイルを選択</label>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFile}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {preview.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">プレビュー（{preview.length}件）</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-1 text-left">カード名</th>
                  <th className="border px-3 py-1 text-left">引き落とし年月</th>
                  <th className="border px-3 py-1 text-right">金額</th>
                  <th className="border px-3 py-1 text-center">マッチ</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => {
                  const matched = cards.some((c) => c.name === row.cardName)
                  return (
                    <tr key={i} className={matched ? '' : 'bg-red-50'}>
                      <td className="border px-3 py-1">{row.cardName}</td>
                      <td className="border px-3 py-1">{row.billingYearMonth}</td>
                      <td className="border px-3 py-1 text-right">{formatCurrency(row.amount)}</td>
                      <td className="border px-3 py-1 text-center">{matched ? 'OK' : '未登録'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <button
              onClick={handleImport}
              className="mt-4 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
            >
              インポートを実行する
            </button>
          </div>
        )}

        {status && <p className="text-sm text-green-700 font-medium">{status}</p>}
      </div>
    </div>
  )
}
