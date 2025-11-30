# Price Watcher

Amazon商品の価格変動を監視するWebアプリケーションです。

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

## プロジェクト構造

```
price-watcher/
├── data/
│   └── products.json          # 商品データ（ID, 商品名, 価格, 履歴等）
├── scripts/
│   ├── update_prices.py       # 価格更新スクリプト
│   ├── add_products.py        # 大量商品追加ツール
│   ├── import_ranking.py      # キーワード検索による商品収集ツール
│   ├── category_manager.py   # カテゴリ管理ツール（データ品質保証）
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

## 技術スタック

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Recharts** (グラフ表示)
- **Python 3** (スクレイピングスクリプト)
- **GitHub Actions** (自動価格更新)

