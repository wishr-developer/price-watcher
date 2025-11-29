#!/usr/bin/env python3
"""
データ洗浄用スクリプト
products.jsonのデータをクリーンアップし、ダミー商品を削除する
"""

import json
import re
from pathlib import Path

# プロジェクトルートのパスを取得
PROJECT_ROOT = Path(__file__).parent.parent
DATA_FILE = PROJECT_ROOT / "data" / "products.json"

# アフィリエイトID
ASSOCIATE_TAG = "xiora-22"


def extract_asin_from_url(url: str) -> str | None:
    """
    URLからASINを抽出する
    """
    if not url:
        return None
    
    # /dp/ASIN パターン
    match = re.search(r"/dp/([A-Z0-9]{10})", url)
    if match:
        return match.group(1)
    
    # /gp/product/ASIN パターン
    match = re.search(r"/gp/product/([A-Z0-9]{10})", url)
    if match:
        return match.group(1)
    
    return None


def build_affiliate_url(asin: str) -> str:
    """
    アフィリエイトリンクを生成する
    """
    return f"https://www.amazon.co.jp/dp/{asin}?tag={ASSOCIATE_TAG}"


def fix_data():
    """データを洗浄する"""
    
    # products.jsonを読み込む
    if not DATA_FILE.exists():
        print(f"エラー: {DATA_FILE} が見つかりません")
        return
    
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        products = json.load(f)
    
    print(f"読み込み完了: {len(products)}件の商品")
    
    # ダミー商品のIDリスト
    dummy_ids = {"1", "2", "3"}
    
    # 修正後の商品リスト
    fixed_products = []
    removed_count = 0
    fixed_count = 0
    regenerated_count = 0
    
    for product in products:
        product_id = product.get("id", "")
        
        # ダミー商品をスキップ
        if product_id in dummy_ids:
            print(f"  削除: ID={product_id} ({product.get('name', 'Unknown')[:50]}...)")
            removed_count += 1
            continue
        
        # affiliateUrlの空白・改行を削除
        affiliate_url = product.get("affiliateUrl", "")
        if affiliate_url:
            original_url = affiliate_url
            affiliate_url = affiliate_url.strip()
            if original_url != affiliate_url:
                product["affiliateUrl"] = affiliate_url
                fixed_count += 1
        
        # urlフィールドがあれば処理（念のため）
        if "url" in product:
            original_url = product["url"]
            product["url"] = product["url"].strip()
            if original_url != product["url"]:
                fixed_count += 1
        
        # affiliateLinkフィールドがあれば処理（念のため）
        if "affiliateLink" in product:
            original_link = product["affiliateLink"]
            product["affiliateLink"] = product["affiliateLink"].strip()
            if original_link != product["affiliateLink"]:
                fixed_count += 1
        
        # アフィリエイトリンクが空の場合は再生成
        if not affiliate_url or affiliate_url == "":
            # 既存のURLからASINを抽出
            asin = extract_asin_from_url(affiliate_url)
            
            # 他のフィールドからASINを探す
            if not asin and "url" in product:
                asin = extract_asin_from_url(product.get("url", ""))
            
            if asin:
                new_url = build_affiliate_url(asin)
                product["affiliateUrl"] = new_url
                regenerated_count += 1
                print(f"  再生成: ID={product_id} ({product.get('name', 'Unknown')[:50]}...)")
            else:
                print(f"  警告: ID={product_id} のASINを抽出できませんでした")
        
        fixed_products.append(product)
    
    # 修正したデータを保存
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(fixed_products, f, ensure_ascii=False, indent=2)
    
    # ログ出力
    print(f"\n{'='*60}")
    print(f"データ洗浄完了")
    print(f"{'='*60}")
    print(f"削除したダミー商品: {removed_count} 件")
    print(f"修正したURL: {fixed_count} 件")
    print(f"再生成したアフィリエイトリンク: {regenerated_count} 件")
    print(f"残りの商品数: {len(fixed_products)} 件")
    print(f"{'='*60}")
    print("データを修正し、ダミー商品を削除しました")


if __name__ == "__main__":
    fix_data()

