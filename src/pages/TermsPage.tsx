import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-blue-50 py-12 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">利用規約</h1>

        <section className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <h2 className="text-base font-semibold text-gray-900">第1条（適用）</h2>
          <p>本規約は、Credit Control（以下「本サービス」）の利用に関する条件を定めるものです。</p>

          <h2 className="text-base font-semibold text-gray-900 pt-2">第2条（利用資格）</h2>
          <p>
            本サービスは運営者本人が個人の資産管理を目的として利用する個人用ツールであり、運営者以外の利用は想定していません。
          </p>

          <h2 className="text-base font-semibold text-gray-900 pt-2">第3条（禁止事項）</h2>
          <p>本サービスの利用にあたり、不正アクセスその他本サービスの運営を妨害する行為を禁止します。</p>

          <h2 className="text-base font-semibold text-gray-900 pt-2">第4条（免責事項）</h2>
          <p>
            本サービスは現状有姿で提供され、運営者は本サービスの利用により生じたいかなる損害についても責任を負いません。
          </p>

          <h2 className="text-base font-semibold text-gray-900 pt-2">第5条（規約の変更）</h2>
          <p>運営者は、必要と判断した場合、本規約を変更することがあります。</p>
        </section>

        <Link to="/login" className="inline-block mt-8 text-sm text-blue-600 hover:underline">
          ← ログイン画面に戻る
        </Link>
      </div>
    </div>
  )
}
