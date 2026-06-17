import * as XLSX from 'xlsx'

// Excelから読み込むカード使用額の1行分
export interface ExcelCardRow {
  cardName: string
  billingYearMonth: string // "YYYY-MM" 形式
  amount: number
}

// ExcelファイルのArrayBufferをパースしてカード使用額リストを返す
export function parseCardChargesFromExcel(buffer: ArrayBuffer): ExcelCardRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet)

  return rows
    .map((row) => ({
      cardName: String(row['カード名'] ?? ''),
      billingYearMonth: String(row['引き落とし年月'] ?? ''),
      amount: Number(row['金額'] ?? 0),
    }))
    .filter((r) => r.cardName && r.billingYearMonth && r.amount > 0)
}
