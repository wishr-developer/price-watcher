#!/usr/bin/env python3
"""
カテゴリ管理ツール
「その他」カテゴリまたはカテゴリが空欄の商品に対して、正しいカテゴリを割り当てるインタラクティブツール
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Optional

# プロジェクトルートのパスを取得
PROJECT_ROOT = Path(__file__).parent.parent
DATA_FILE = PROJECT_ROOT / "data" / "products.json"
CATEGORY_MAP_FILE = PROJECT_ROOT / "src" / "data" / "category_map.json"

# 利用可能なカテゴリリスト
AVAILABLE_CATEGORIES = [
    "ガジェット",
    "家電",
    "キッチン",
    "ゲーム",
    "ヘルスケア",
    "ビューティー",
    "食品",
    "文房具",
    "その他",
]


def load_products() -> List[Dict]:
    """商品データを読み込む"""
    if not DATA_FILE.exists():
        print(f"エラー: {DATA_FILE} が見つかりません")
        sys.exit(1)
    
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"エラー: 商品データの読み込みに失敗しました: {e}")
        sys.exit(1)


def load_category_map() -> Dict[str, List[str]]:
    """カテゴリマッピングを読み込む"""
    if not CATEGORY_MAP_FILE.exists():
        print(f"警告: {CATEGORY_MAP_FILE} が見つかりません。新規作成します。")
        return {}
    
    try:
        with open(CATEGORY_MAP_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"警告: カテゴリマッピングの読み込みに失敗しました: {e}")
        return {}


def save_products(products: List[Dict]) -> None:
    """商品データを保存する"""
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(products, f, ensure_ascii=False, indent=2)
        print(f"✓ 商品データを保存しました: {DATA_FILE}")
    except Exception as e:
        print(f"エラー: 商品データの保存に失敗しました: {e}")
        sys.exit(1)


def save_category_map(category_map: Dict[str, List[str]]) -> None:
    """カテゴリマッピングを保存する"""
    try:
        # ディレクトリが存在しない場合は作成
        CATEGORY_MAP_FILE.parent.mkdir(parents=True, exist_ok=True)
        
        with open(CATEGORY_MAP_FILE, "w", encoding="utf-8") as f:
            json.dump(category_map, f, ensure_ascii=False, indent=2)
        print(f"✓ カテゴリマッピングを保存しました: {CATEGORY_MAP_FILE}")
    except Exception as e:
        print(f"エラー: カテゴリマッピングの保存に失敗しました: {e}")
        sys.exit(1)


def filter_uncategorized_products(products: List[Dict]) -> List[tuple[int, Dict]]:
    """
    カテゴリが「その他」または空欄の商品を抽出
    戻り値: (インデックス, 商品データ) のタプルのリスト
    """
    uncategorized = []
    for idx, product in enumerate(products):
        category = product.get("category", "").strip()
        if not category or category == "その他":
            uncategorized.append((idx, product))
    return uncategorized


def display_product_info(product: Dict, index: int, total: int) -> None:
    """商品情報を表示"""
    print("\n" + "=" * 60)
    print(f"商品 {index + 1}/{total}")
    print("=" * 60)
    print(f"ID: {product.get('id', 'N/A')}")
    print(f"商品名: {product.get('name', 'N/A')}")
    print(f"現在のカテゴリ: {product.get('category', '(未設定)')}")
    print(f"価格: ¥{product.get('currentPrice', 0):,}")
    print("-" * 60)


def display_available_categories() -> None:
    """利用可能なカテゴリを表示"""
    print("\n利用可能なカテゴリ:")
    for i, category in enumerate(AVAILABLE_CATEGORIES, 1):
        print(f"  {i}. {category}")
    print("  0. スキップ（後で処理）")
    print("  q. 終了（保存して終了）")
    print("  x. 終了（保存せずに終了）")


def get_user_input() -> Optional[str]:
    """ユーザー入力を取得"""
    while True:
        choice = input("\nカテゴリを選択してください (番号またはカテゴリ名): ").strip()
        
        # 終了コマンド
        if choice.lower() == "q":
            return "SAVE_AND_EXIT"
        if choice.lower() == "x":
            return "EXIT_WITHOUT_SAVE"
        
        # 番号で選択
        if choice.isdigit():
            num = int(choice)
            if num == 0:
                return "SKIP"
            if 1 <= num <= len(AVAILABLE_CATEGORIES):
                return AVAILABLE_CATEGORIES[num - 1]
            print(f"エラー: 1〜{len(AVAILABLE_CATEGORIES)}の範囲で入力してください")
            continue
        
        # カテゴリ名で直接入力
        if choice in AVAILABLE_CATEGORIES:
            return choice
        
        # 新しいカテゴリ名として受け入れる（大文字小文字を無視）
        if choice:
            # 既存カテゴリと大文字小文字を無視して比較
            for cat in AVAILABLE_CATEGORIES:
                if choice.lower() == cat.lower():
                    return cat
            
            # 新しいカテゴリとして確認
            confirm = input(f"新しいカテゴリ「{choice}」を追加しますか？ (y/N): ").strip().lower()
            if confirm == "y":
                return choice
        
        print("エラー: 無効な入力です。もう一度入力してください。")


def add_keyword_to_category_map(category_map: Dict[str, List[str]], category: str, product_name: str) -> None:
    """
    商品名からキーワードを抽出し、カテゴリマッピングに追加
    簡易的な実装: 商品名の最初の数語をキーワードとして追加
    """
    if category not in category_map:
        category_map[category] = []
    
    # 商品名から主要なキーワードを抽出（簡易版）
    # 実際の実装では、より高度なキーワード抽出が必要かもしれません
    words = product_name.split()
    if words:
        # 最初の単語をキーワード候補として追加（重複チェック）
        keyword = words[0]
        if keyword not in category_map[category]:
            category_map[category].append(keyword)
            print(f"  → キーワード「{keyword}」をカテゴリ「{category}」に追加しました")


def main():
    """メイン処理"""
    print("=" * 60)
    print("  TRENDIX - カテゴリ管理ツール")
    print("=" * 60)
    print()
    
    # データを読み込む
    print("データを読み込んでいます...")
    products = load_products()
    category_map = load_category_map()
    
    print(f"✓ 商品データ: {len(products)}件")
    print(f"✓ カテゴリマッピング: {len(category_map)}カテゴリ")
    print()
    
    # 未分類商品を抽出
    uncategorized = filter_uncategorized_products(products)
    
    if not uncategorized:
        print("✓ すべての商品にカテゴリが設定されています！")
        return
    
    print(f"未分類商品: {len(uncategorized)}件")
    print("（カテゴリが「その他」または空欄の商品）")
    print()
    
    # インタラクティブにカテゴリを割り当て
    updated_count = 0
    skipped_count = 0
    new_categories = []
    
    for idx, (product_idx, product) in enumerate(uncategorized):
        display_product_info(product, idx, len(uncategorized))
        display_available_categories()
        
        user_input = get_user_input()
        
        if user_input == "SAVE_AND_EXIT":
            print("\n処理を中断します。変更を保存しますか？")
            save_choice = input("(y/N): ").strip().lower()
            if save_choice == "y":
                save_products(products)
                save_category_map(category_map)
            print("処理を終了しました。")
            return
        
        if user_input == "EXIT_WITHOUT_SAVE":
            print("\n処理を中断しました。変更は保存されませんでした。")
            return
        
        if user_input == "SKIP":
            print("  → スキップしました")
            skipped_count += 1
            continue
        
        # カテゴリを更新
        category = user_input
        products[product_idx]["category"] = category
        updated_count += 1
        
        # 新しいカテゴリの場合はリストに追加
        if category not in AVAILABLE_CATEGORIES:
            new_categories.append(category)
            if category not in category_map:
                category_map[category] = []
        
        # カテゴリマッピングにキーワードを追加（学習機能）
        add_keyword_to_category_map(category_map, category, product.get("name", ""))
        
        print(f"  ✓ カテゴリを「{category}」に更新しました")
    
    # 結果を表示
    print("\n" + "=" * 60)
    print("処理完了")
    print("=" * 60)
    print(f"更新: {updated_count}件")
    print(f"スキップ: {skipped_count}件")
    if new_categories:
        print(f"新規カテゴリ: {', '.join(new_categories)}")
    print()
    
    # 保存確認
    if updated_count > 0:
        print("変更を保存しますか？")
        save_choice = input("(Y/n): ").strip().lower()
        if save_choice != "n":
            save_products(products)
            save_category_map(category_map)
            print("\n✓ すべての変更を保存しました！")
        else:
            print("\n変更は保存されませんでした。")
    else:
        print("変更がないため、保存をスキップしました。")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n処理が中断されました。")
        sys.exit(0)

