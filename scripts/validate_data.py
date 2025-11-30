#!/usr/bin/env python3
"""
商品データの整合性を検証するスクリプト

検証項目:
1. 価格履歴の時系列順序
2. 必須フィールドの存在チェック
3. 価格の妥当性チェック（0または負の値でないか）
4. ASINの形式チェック
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

# データファイルのパス
DATA_FILE = Path(__file__).parent.parent / "data" / "products.json"

# 必須フィールド
REQUIRED_FIELDS = ["id", "name", "currentPrice", "affiliateUrl"]


def extract_asin_from_url(url: str) -> str | None:
    """URLからASINを抽出"""
    import re
    match = re.search(r"/dp/([A-Z0-9]{10})|/gp/product/([A-Z0-9]{10})", url)
    if match:
        return match.group(1) or match.group(2)
    return None


def validate_price_history(history: List[Dict[str, Any]], product_id: str) -> List[str]:
    """価格履歴の時系列順序を検証"""
    errors = []
    
    if not history:
        return errors
    
    # 日付でソートして、時系列順序を確認
    sorted_history = sorted(history, key=lambda x: x.get("date", ""))
    
    # 元の順序と比較
    if history != sorted_history:
        errors.append(f"商品ID {product_id}: 価格履歴が時系列順序でない")
    
    # 各エントリの日付形式を確認
    for i, entry in enumerate(history):
        date_str = entry.get("date", "")
        if not date_str:
            errors.append(f"商品ID {product_id}: 価格履歴[{i}]に日付がない")
            continue
        
        try:
            datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except ValueError:
            errors.append(f"商品ID {product_id}: 価格履歴[{i}]の日付形式が不正: {date_str}")
    
    return errors


def validate_required_fields(product: Dict[str, Any], product_id: str) -> List[str]:
    """必須フィールドの存在をチェック"""
    errors = []
    
    for field in REQUIRED_FIELDS:
        if field not in product:
            errors.append(f"商品ID {product_id}: 必須フィールド '{field}' が存在しません")
        elif not product[field]:
            errors.append(f"商品ID {product_id}: 必須フィールド '{field}' が空です")
    
    return errors


def validate_price(product: Dict[str, Any], product_id: str) -> List[str]:
    """価格の妥当性をチェック"""
    errors = []
    
    # 現在価格のチェック
    current_price = product.get("currentPrice")
    if current_price is None:
        errors.append(f"商品ID {product_id}: currentPrice が存在しません")
    elif not isinstance(current_price, (int, float)):
        errors.append(f"商品ID {product_id}: currentPrice が数値ではありません: {current_price}")
    elif current_price <= 0:
        errors.append(f"商品ID {product_id}: currentPrice が0以下です: {current_price}")
    
    # 価格履歴のチェック
    history = product.get("priceHistory", [])
    for i, entry in enumerate(history):
        price = entry.get("price")
        if price is None:
            errors.append(f"商品ID {product_id}: 価格履歴[{i}]にpriceが存在しません")
        elif not isinstance(price, (int, float)):
            errors.append(f"商品ID {product_id}: 価格履歴[{i}]のpriceが数値ではありません: {price}")
        elif price < 0:
            errors.append(f"商品ID {product_id}: 価格履歴[{i}]のpriceが負の値です: {price}")
    
    return errors


def validate_asin(product: Dict[str, Any], product_id: str) -> List[str]:
    """ASINの形式をチェック"""
    errors = []
    
    # ASINフィールドがある場合
    if "asin" in product and product["asin"]:
        asin = product["asin"]
        if not isinstance(asin, str):
            errors.append(f"商品ID {product_id}: asin が文字列ではありません: {asin}")
        elif len(asin) != 10:
            errors.append(f"商品ID {product_id}: asin の長さが不正です (10文字である必要があります): {asin}")
        elif not asin.isalnum():
            errors.append(f"商品ID {product_id}: asin に無効な文字が含まれています: {asin}")
    
    # affiliateUrlからASINを抽出して検証
    affiliate_url = product.get("affiliateUrl", "")
    if affiliate_url:
        extracted_asin = extract_asin_from_url(affiliate_url)
        if not extracted_asin:
            errors.append(f"商品ID {product_id}: affiliateUrl からASINを抽出できません: {affiliate_url}")
    
    return errors


def validate_product(product: Dict[str, Any], index: int) -> List[str]:
    """単一商品の検証"""
    errors = []
    product_id = product.get("id", f"index_{index}")
    
    # 必須フィールドのチェック
    errors.extend(validate_required_fields(product, product_id))
    
    # 価格の妥当性チェック
    errors.extend(validate_price(product, product_id))
    
    # 価格履歴の時系列順序チェック
    history = product.get("priceHistory", [])
    if history:
        errors.extend(validate_price_history(history, product_id))
    
    # ASINの形式チェック
    errors.extend(validate_asin(product, product_id))
    
    return errors


def main():
    """メイン処理"""
    print("=" * 60)
    print("商品データ検証スクリプト")
    print("=" * 60)
    print()
    
    # データファイルの存在確認
    if not DATA_FILE.exists():
        print(f"❌ エラー: データファイルが見つかりません: {DATA_FILE}")
        sys.exit(1)
    
    # データファイルの読み込み
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            products = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ エラー: JSONのパースに失敗しました: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ エラー: ファイルの読み込みに失敗しました: {e}")
        sys.exit(1)
    
    if not isinstance(products, list):
        print("❌ エラー: データが配列形式ではありません")
        sys.exit(1)
    
    print(f"📦 総商品数: {len(products)}")
    print()
    
    # 各商品を検証
    all_errors = []
    products_with_errors = set()
    
    for i, product in enumerate(products):
        errors = validate_product(product, i)
        if errors:
            all_errors.extend(errors)
            product_id = product.get("id", f"index_{i}")
            products_with_errors.add(product_id)
    
    # 結果の表示
    print("=" * 60)
    print("検証結果")
    print("=" * 60)
    print()
    
    if all_errors:
        print(f"⚠️  問題が見つかりました:")
        print(f"   - エラー数: {len(all_errors)}")
        print(f"   - 問題のある商品数: {len(products_with_errors)}")
        print(f"   - 総商品数: {len(products)}")
        print()
        print("詳細なエラー:")
        print("-" * 60)
        for error in all_errors:
            print(f"  • {error}")
        print()
        print("=" * 60)
        print("❌ 検証失敗: データに問題があります")
        print("=" * 60)
        sys.exit(1)
    else:
        print("✅ すべての検証項目を通過しました")
        print(f"   - 検証商品数: {len(products)}")
        print()
        print("=" * 60)
        print("✅ 検証成功: データに問題はありません")
        print("=" * 60)
        sys.exit(0)


if __name__ == "__main__":
    main()

