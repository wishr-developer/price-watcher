# TRENDIX

Amazon商品の価格変動を監視し、最安値トレンドをリアルタイム速報するECメディアサイトです。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

または

```bash
yarn install
```

または

```bash
pnpm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

または

```bash
yarn dev
```

または

```bash
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認してください。

### 3. 環境変数の設定（価格アラート機能を使用する場合）

価格アラート機能（メール通知）を使用するには、以下の環境変数の設定が必要です。

#### 必須環境変数

1. **Resend APIキー** (`RESEND_API_KEY`)
   - **Resendアカウントの作成**
   - [Resend](https://resend.com) にアクセスしてアカウントを作成します
   - API Keys セクションからAPIキーを取得します

2. **環境変数ファイルの作成**
   - プロジェクトルートに `.env.local` ファイルを作成します
   - 以下の内容を記入します：

```env
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 送信元メールアドレス（Resendで認証済みのドメインのメールアドレス）
# 例: noreply@yourdomain.com
RESEND_FROM_EMAIL=noreply@yourdomain.com

# アラート監視ジョブの秘密トークン
# ランダムな文字列を生成して設定してください（例: openssl rand -hex 32）
ALERT_SECRET=your-random-secret-token-here
```

3. **ドメインの認証（本番環境）**
   - Resendでドメインを認証する必要があります
   - 開発環境では、Resendが提供するテスト用メールアドレスを使用できます

4. **Vercel環境変数の設定（本番環境）**
   - Vercelダッシュボードの「Settings」→「Environment Variables」で以下を設定：
     - `RESEND_API_KEY`: Resend APIキー
     - `RESEND_FROM_EMAIL`: 送信元メールアドレス
     - `ALERT_SECRET`: アラート監視ジョブの秘密トークン

5. **GitHub Secretsの設定（バックグラウンドジョブ用）**
   - GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」で以下を設定：
     - `VERCEL_URL`: VercelにデプロイされたサイトのURL（例: `https://your-app.vercel.app`）
     - `ALERT_SECRET`: アラート監視ジョブの秘密トークン（Vercelの環境変数と同じ値）
   - **注意**: `ALERT_SECRET`は、Vercelの環境変数とGitHub Secretsで同じ値を使用してください。

4. **Vercel環境変数の設定（本番環境）**
   - Vercelダッシュボードの「Settings」→「Environment Variables」で以下を設定：
     - `RESEND_API_KEY`: Resend APIキー
     - `RESEND_FROM_EMAIL`: 送信元メールアドレス
     - `ALERT_SECRET`: アラート監視ジョブの秘密トークン

5. **GitHub Secretsの設定（バックグラウンドジョブ用）**
   - GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」で以下を設定：
     - `VERCEL_URL`: VercelにデプロイされたサイトのURL（例: `https://your-app.vercel.app`）
     - `ALERT_SECRET`: アラート監視ジョブの秘密トークン（Vercelの環境変数と同じ値）
   - **注意**: `ALERT_SECRET`は、Vercelの環境変数とGitHub Secretsで同じ値を使用してください。

**注意事項:**
- `.env.local` ファイルは `.gitignore` に含まれているため、Gitにコミットされません
- APIキーは機密情報のため、絶対に公開リポジトリにコミットしないでください
- メール送信機能を使用しない場合でも、アラート設定自体は動作します（メール送信のみスキップされます）
- バックグラウンドジョブは、GitHub Actionsで毎週月曜日の朝8時（JST）に自動実行されます
- バックグラウンドジョブは、GitHub Actionsで毎週月曜日の朝8時（JST）に自動実行されます

### 4. Google Analytics 4 (GA4) の設定（オプション）

ユーザーの利用状況を分析するために、Google Analytics 4を統合できます。

1. **Google Analytics 4プロパティの作成**
   - [Google Analytics](https://analytics.google.com/) にアクセスしてアカウントを作成します
   - 新しいプロパティを作成し、測定ID（例: `G-XXXXXXXXXX`）を取得します

2. **環境変数ファイルの更新**
   - `.env.local` ファイルに以下の内容を追加します：

```env
# Google Analytics 4 測定ID
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

3. **動作確認**
   - 開発サーバーを再起動します
   - ブラウザの開発者ツールでネットワークタブを確認し、`gtag/js` へのリクエストが送信されていることを確認します
   - Google Analyticsのリアルタイムレポートでアクセスが記録されていることを確認します

**注意事項:**
- `NEXT_PUBLIC_GA_ID` が設定されていない場合、GA4トラッキングは無効になります（エラーは発生しません）
- 本番環境では、Vercelなどのホスティングサービスの環境変数設定から `NEXT_PUBLIC_GA_ID` を設定してください
- プライバシーポリシーにGA4の使用を明記することを推奨します

## テスト

### ユニットテスト（Jest）

コンポーネントのユニットテストを実行します：

```bash
# 全テストを実行
npm test

# ウォッチモードで実行（ファイル変更時に自動再実行）
npm run test:watch

# カバレッジレポート付きで実行
npm run test:coverage
```

### E2Eテスト（Playwright）

エンドツーエンドテストを実行します：

```bash
# E2Eテストを実行（Chromiumのみ）
npm run test:e2e

# UIモードで実行（視覚的にテストを確認）
npm run test:e2e:ui

# ヘッド付きモードで実行（ブラウザを表示）
npm run test:e2e:headed

# テストレポートを表示
npm run test:e2e:report
```

**注意事項:**
- E2Eテストを実行する前に、開発サーバーが起動している必要があります（`npm run dev`）
- Playwrightは自動的に開発サーバーを起動しますが、手動で起動することも可能です
- 初回実行時は、Playwrightのブラウザをインストールする必要があります：`npx playwright install --with-deps chromium`

## スクリプト

### 価格更新スクリプト

商品の価格を更新するには、以下のコマンドを実行します：

```bash
python3 scripts/update_prices.py
```

このスクリプトは、各商品のAmazonページから価格をスクレイピングして更新します。取得に失敗した場合は、ランダム変動をフォールバックとして使用します。

### 大量商品追加ツール

複数の商品を一度に追加するには、以下の手順を実行します：

1. `scripts/urls.txt` にAmazon商品URLを1行に1つずつ記入します：

```
https://www.amazon.co.jp/dp/B09JQ6K8M1
https://www.amazon.co.jp/dp/B09Y2MYL5T
```

2. 以下のコマンドを実行します：

```bash
python3 scripts/add_products.py
```

このスクリプトは、各URLから商品名、価格、画像URLを取得し、`data/products.json`に追記します。既に登録されている商品はスキップされます。

### キーワード検索による商品収集

Amazonの検索結果から商品を一括で取得するには、以下の手順を実行します：

1. `scripts/keywords.txt` に検索キーワードを1行に1つずつ記入します：

```
USB-C ハブ
ワイヤレスイヤホン
デスクライト
キャンプチェア
プロテイン
```

2. 以下のコマンドを実行します：

```bash
python3 scripts/import_ranking.py
```

このスクリプトは、各キーワードでAmazon検索を行い、検索結果の最初の3ページから商品情報を抽出して `data/products.json` に追記します。各キーワードにつき最大3ページを巡回するため、広範囲な商品収集が可能です。価格が取得できない場合は0円として登録されます（後続の価格更新スクリプトで補正されます）。既に登録されている商品は重複チェックによりスキップされます。

### バルク商品追加（5,000件を目指す）

商品数を5,000件まで安全に増やすためのバルク実行スクリプトです。

**使用方法:**

```bash
./scripts/bulk_runner.sh
```

**機能:**
- `import_ranking.py` を5回連続で実行
- 各実行間に60秒の待機時間を設けて、Amazonからのブロックを回避
- 実行開始・終了時刻をログ出力
- 実行後に自動でGit操作（add, commit, push）を実行

**実行時間:**
- 1回の実行で約5〜6分
- 最大750件（150件×5回）の商品を追加可能

**推奨手順:**
1. `scripts/keywords.txt` に検索キーワードを複数記入（20個以上推奨）
2. `./scripts/bulk_runner.sh` を実行
3. 商品数が5,000件に達するまで、手順2を繰り返し実行

**注意事項:**
- スクリプト実行前に、`scripts/keywords.txt` に適切なキーワードが記入されていることを確認してください
- 各実行間の60秒待機は、Amazonからのブロックを避けるための安全措置です
- Git操作は、変更が検出された場合のみ実行されます
- 各キーワードにつき3ページを巡回するため、1回の実行で大量の商品を収集できます

### AI自動分類（LLM連携準備）

カテゴリが「その他」または空欄になっている商品を、外部LLM（大規模言語モデル）で自動分類することを想定したスクリプトです。

現時点では、LLM API への接続は行わず、商品名のキーワードに基づく簡易ロジック＋フォールバック用のランダムカテゴリでモック分類を行います。
将来的に OpenAI / Gemini などと連携する際は、このスクリプトの `classify_with_llm()` を拡張してください。

**使用方法:**

```bash
python3 scripts/auto_categorizer.py
```

**機能:**

- `data/products.json` を読み込み
- カテゴリが「その他」または空欄の商品を自動抽出
- `classify_with_llm(product_name)` でカテゴリ候補を算出
- 結果を各商品の `category` フィールドに書き込み、`products.json` を上書き保存

**環境変数:**

```env
# 将来のLLM API連携用（現在のモック実装では必須ではありません）
LLM_API_KEY=your-llm-api-key-here
```

- 現在の実装では `LLM_API_KEY` が未設定でも警告のみを表示し、モック分類を実行します。
- 実際に外部LLMと連携する際は、このキーを用いて HTTP クライアントから API を呼び出す構造に変更してください。

## プロジェクト構造

```
price-watcher/
├── data/
│   └── products.json          # 商品データ（ID, 商品名, 価格, 履歴等）
├── scripts/
│   ├── update_prices.py       # 価格更新スクリプト
│   ├── add_products.py        # 大量商品追加ツール
│   ├── import_ranking.py      # キーワード検索による商品収集ツール
│   ├── category_manager.py    # カテゴリ管理ツール（データ品質保証）
│   ├── auto_categorizer.py    # AI自動分類スクリプト（LLM連携準備）
│   ├── bulk_runner.sh        # バルク商品追加スクリプト（5,000件を目指す）
│   ├── urls.txt               # 商品URLリスト（手動編集）
│   └── keywords.txt           # 検索キーワードリスト（手動編集）
├── src/
│   ├── app/
│   │   ├── layout.tsx         # ルートレイアウト
│   │   ├── page.tsx           # メインページ
│   │   ├── privacy/
│   │   │   └── page.tsx        # プライバシーポリシーページ
│   │   ├── legal/
│   │   │   └── page.tsx        # 特定商取引法に基づく表記
│   │   └── globals.css        # グローバルスタイル
│   ├── components/
│   │   ├── ProductCard.tsx    # 商品カードコンポーネント
│   │   └── Footer.tsx         # フッターコンポーネント
│   └── types/
│       └── product.ts         # 型定義
├── .github/
│   └── workflows/
│       └── daily_update.yml   # GitHub Actions ワークフロー
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── requirements.txt
```

## 機能

- ✅ Amazon商品の価格変動を監視
- ✅ 価格推移グラフの表示
- ✅ 自動価格更新（GitHub Actions）
- ✅ 大量商品追加ツール
- ✅ キーワード検索による広範囲な商品収集
- ✅ **価格アラート機能（メール通知）** - Resend APIキーが必要
- ✅ プライバシーポリシー・特定商取引法に基づく表記
- ✅ レスポンシブデザイン

## データのメンテナンス

### カテゴリ管理ツール

商品のカテゴリが「その他」または空欄になっている場合、以下のツールを使用して正しいカテゴリを割り当てることができます。

**使用方法:**

```bash
python3 scripts/category_manager.py
```

**機能:**
- カテゴリが「その他」または空欄の商品を自動抽出
- インタラクティブにカテゴリを割り当て
- 新しいカテゴリを追加可能
- カテゴリマッピングの自動学習（商品名からキーワードを抽出）
- 処理の途中で保存して終了可能

**操作:**
- 番号（1-9）でカテゴリを選択
- カテゴリ名を直接入力
- `0` でスキップ
- `q` で保存して終了
- `x` で保存せずに終了

このツールにより、「その他」カテゴリの商品をゼロに保ち、データ品質を維持できます。

### データ検証スクリプト

商品データの整合性を検証するスクリプトです。定期的に実行して、データ品質を保証します。

**使用方法:**

```bash
python3 scripts/validate_data.py
```

**検証項目:**
- 価格履歴の時系列順序の確認
- 必須フィールド（id, name, currentPrice, affiliateUrl）の存在チェック
- 価格が0または負の値でないかチェック
- ASINの形式チェック

**出力:**
- 検証結果のサマリー（エラー数、問題のある商品数、総商品数）
- 詳細なエラーメッセージ（問題のある商品ごと）

**終了コード:**
- `0`: すべての検証項目を通過
- `1`: 問題が見つかった

このスクリプトにより、データの整合性を定期的に確認し、問題を早期に発見できます。

## 価格アラートのバックグラウンドジョブ

価格アラート機能では、ユーザーが設定したアラートを定期的にチェックし、目標価格に達した際に自動でメール通知を送信します。

### 仕組み

1. **アラート設定**: ユーザーが商品ページでアラートを設定すると、`data/alerts.json`に保存されます
2. **定期チェック**: GitHub Actionsが毎週月曜日の朝8時（JST）に`/api/alert-check`を呼び出します
3. **価格チェック**: 各アラートの商品価格を確認し、目標価格以下になった場合に通知メールを送信します
4. **通知後処理**: 通知済みのアラートは非アクティブになり、重複通知を防ぎます

### 手動実行

GitHub Actionsのワークフローを手動で実行することもできます：

1. GitHubリポジトリの「Actions」タブに移動
2. 「Price Alert Scheduler」ワークフローを選択
3. 「Run workflow」ボタンをクリック

### トラブルシューティング

- **アラートが動作しない場合**:
  - `ALERT_SECRET`がVercelとGitHub Secretsの両方で正しく設定されているか確認
  - `VERCEL_URL`が正しいURLに設定されているか確認
  - GitHub Actionsの実行ログを確認

- **メールが送信されない場合**:
  - `RESEND_API_KEY`が正しく設定されているか確認
  - Resendのダッシュボードでメール送信履歴を確認
  - アラートデータ（`data/alerts.json`）が正しく保存されているか確認

## 商品詳細ページ

各商品には専用の詳細ページ（`/products/[asin]`）が用意されています。

### 機能

- **商品情報の詳細表示**: 商品画像、名前、現在価格、価格変動情報を大きく表示
- **価格推移グラフ**: 過去の価格推移を視覚的に表示（recharts使用）
- **価格履歴テーブル**: 最新20件の価格履歴を表形式で表示
- **過去最安値の表示**: 現在価格が過去最安値かどうかを明示
- **SEO最適化**: 動的メタデータ（OGP、Twitter Card）を自動生成
- **Amazon購入ボタン**: 商品詳細ページから直接Amazonで購入可能

### アクセス方法

商品カードをクリックすると、商品詳細ページに遷移します。URL形式は `/products/[ASIN]` です。

### 404エラー対応

存在しないASINでアクセスした場合、自動的に404ページにリダイレクトされます。

## お気に入り機能

ユーザーがお気に入り登録した商品を一覧で管理できる専用ページ（`/favorites`）が用意されています。

### 機能

- **お気に入り一覧ページ**: ヘッダーのお気に入りボタン（ショッピングバッグアイコン）からアクセス
- **リアルタイム同期**: 他のタブでのお気に入り変更も即座に反映
- **空の状態UI**: お気に入りが0件の場合、分かりやすいメッセージとトップページへのリンクを表示
- **商品カード表示**: お気に入り商品を`ProductCard`コンポーネントで一覧表示

### アクセス方法

1. ヘッダーのお気に入りボタン（ショッピングバッグアイコン）をクリック
2. `/favorites`ページに遷移
3. お気に入りに登録した商品が一覧で表示されます

### お気に入りの追加・削除

- 商品カードのハートアイコンをクリックして追加・削除
- 変更は`localStorage`に保存され、すべてのタブで同期されます

### お気に入りページの検索機能

- ヘッダーの検索バーを使用して、お気に入りページ内で商品をフィルタリングできます
- 検索クエリはURLパラメータ（`?q=検索語`）に反映され、ブックマークや共有が可能です

## 技術スタック

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Recharts** (グラフ表示)
- **Resend** (メール送信サービス)
- **Python 3** (スクレイピングスクリプト)
- **GitHub Actions** (自動価格更新、価格アラート監視)
- **next-intl** (国際化対応 - 基盤実装済み)
- **Playwright** (E2Eテスト)
- **Jest** (ユニットテスト)

## 価格アラート機能

ユーザーが商品の目標価格を設定すると、価格が目標価格に達した際にメール通知を送信します。

### 機能概要

- **アラート設定**: 商品カードから「値下がり通知を受け取る」ボタンをクリックして設定
- **確認メール**: アラート設定時に確認メールを送信
- **通知メール**: 価格が目標価格に達した際に通知メールを自動送信（GitHub Actionsで定期チェック）
- **バックグラウンドジョブ**: 毎週月曜日の朝8時（JST）に自動で価格をチェック

### セットアップ要件

- Resend APIキーが必要です（上記「環境変数の設定」を参照）
- APIキーが設定されていない場合でも、アラート設定自体は動作します（メール送信のみスキップされます）

