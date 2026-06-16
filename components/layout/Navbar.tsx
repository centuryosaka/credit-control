'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'ダッシュボード' },
  { href: '/bank', label: '銀行口座' },
  { href: '/cards', label: 'カード管理' },
  { href: '/import', label: 'Excelインポート' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex gap-6 items-center">
      <span className="font-bold text-lg mr-4">Credit Control</span>
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`text-sm hover:text-blue-200 transition-colors ${
            pathname === href ? 'underline font-semibold' : ''
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
