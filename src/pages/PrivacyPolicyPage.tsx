import { Link } from 'react-router-dom'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-blue-50 py-12 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">プライバシーポリシー</h1>

        <section className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>
            Credit Control（以下「本サービス」）は、運営者本人が個人の銀行口座残高とクレジットカード引き落とし予定額を管理するために開発・運用している個人用ツールです。
          </p>

          <h2 className="text-base font-semibold text-gray-900 pt-2">1. 取得する情報</h2>
          <p>
            本サービスは、ログイン認証のためにGoogleおよびYahoo! JAPAN IDのOAuth／OpenID
            Connect連携を通じて、メールアドレスおよび氏名（表示名）を取得します。
          </p>

          <h2 className="text-base font-semibold text-gray-900 pt-2">2. 利用目的</h2>
          <p>取得した情報は、本人確認およびログイン機能の提供のためにのみ利用します。</p>

          <h2 className="text-base font-semibold text-gray-900 pt-2">3. 第三者への提供</h2>
          <p>取得した情報を本人の同意なく第三者に提供することはありません。</p>

          <h2 className="text-base font-semibold text-gray-900 pt-2">4. 情報の保管</h2>
          <p>
            取得した情報はSupabase（データベースサービス）上で安全に管理し、本サービスの運営に必要な範囲でのみ保持します。
          </p>

          <h2 className="text-base font-semibold text-gray-900 pt-2">5. お問い合わせ</h2>
          <p>本ポリシーに関するお問い合わせは下記までご連絡ください。</p>
          <p>kanamotoi@best-partners.co.jp</p>
        </section>

        <Link to="/login" className="inline-block mt-8 text-sm text-blue-600 hover:underline">
          ← ログイン画面に戻る
        </Link>
      </div>
    </div>
  )
}
