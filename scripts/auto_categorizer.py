#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
AI自動分類スクリプト

data/products.json を読み込み、カテゴリが「その他」または未設定の商品だけを抽出し、
外部LLM（大規模言語モデル）に投げることを想定した構造でカテゴリを自動付与します。

現時点では実際のLLM APIは呼び出さず、classify_with_llm() 内で
簡易なキーワードベースのモック分類を行います。

将来的に OpenAI / Gemini などを利用する場合は、このファイルに
HTTPクライアントを追加し、LLM_API_KEY 環境変数から取得したキーを利用してください。
"""

import json
import os
import random
from pathlib import Path
from typing import Any, Dict, List

BASE_DIR = Path(__file__).resolve().parents[1]
PRODUCTS_PATH = BASE_DIR / "data" / "products.json"


def load_products() -> List[Dict[str, Any]]:
  """products.json を読み込む"""
  if not PRODUCTS_PATH.exists():
    raise FileNotFoundError(f"products.json が見つかりません: {PRODUCTS_PATH}")

  with PRODUCTS_PATH.open("r", encoding="utf-8") as f:
    return json.load(f)


def save_products(products: List[Dict[str, Any]]) -> None:
  """products.json を上書き保存する（UTF-8 / インデント付き）"""
  with PRODUCTS_PATH.open("w", encoding="utf-8") as f:
    json.dump(products, f, ensure_ascii=False, indent=2)


def is_unclassified(product: Dict[str, Any]) -> bool:
  """カテゴリが未分類（空 or 'その他'）かどうかを判定"""
  category = product.get("category")
  if category is None:
    return True
  if isinstance(category, str) and category.strip() == "":
    return True
  if category == "その他":
    return True
  return False


def classify_with_llm(product_name: str) -> str:
  """
  LLM でカテゴリ分類することを想定したモック関数。

  - 実運用ではここで外部APIを呼び出す。
  - 今は簡易なキーワードマッチ + ランダムフォールバックでカテゴリを返す。
  """
  name_lower = product_name.lower()

  # キーワードベースの簡易分類
  rules = [
    ("laptop", "Electronics"),
    ("macbook", "Electronics"),
    ("ipad", "Electronics"),
    ("iphone", "Electronics"),
    ("usb", "Electronics"),
    ("ssd", "Electronics"),
    ("memory", "Electronics"),
    ("keyboard", "Electronics"),
    ("mouse", "Electronics"),
    ("monitor", "Electronics"),
    ("chair", "Home"),
    ("desk", "Home"),
    ("sofa", "Home"),
    ("lamp", "Home"),
    ("light", "Home"),
    ("pan", "Kitchen"),
    ("pot", "Kitchen"),
    ("kitchen", "Kitchen"),
    ("mug", "Kitchen"),
    ("cup", "Kitchen"),
    ("protein", "Health"),
    ("vitamin", "Health"),
    ("supplement", "Health"),
    ("camp", "Outdoor"),
    ("tent", "Outdoor"),
  ]

  for keyword, category in rules:
    if keyword in name_lower:
      return category

  # ここまででマッチしなければランダムに割り当て（モック）
  fallback_categories = [
    "Electronics",
    "Home",
    "Kitchen",
    "Health",
    "Outdoor",
    "Fashion",
  ]
  return random.choice(fallback_categories)


def main() -> None:
  # 将来の本番運用のために環境変数をチェックしておく（今は未使用だが構造だけ用意）
  llm_api_key = os.getenv("LLM_API_KEY")
  if not llm_api_key:
    print("[WARN] LLM_API_KEY が設定されていません。現在はモック分類のみを実行します。")

  products = load_products()
  print(f"[INFO] 全商品数: {len(products)}")

  # 未分類の商品を抽出
  unclassified_indices: List[int] = []
  for idx, p in enumerate(products):
    if is_unclassified(p):
      unclassified_indices.append(idx)

  if not unclassified_indices:
    print("[INFO] 未分類（その他/空）の商品はありません。処理を終了します。")
    return

  print(f"[INFO] 未分類の商品数: {len(unclassified_indices)}")

  # 分類と上書き
  updated_count = 0
  for idx in unclassified_indices:
    product = products[idx]
    name = product.get("name", "")
    before = product.get("category")
    new_category = classify_with_llm(name)
    products[idx]["category"] = new_category
    updated_count += 1
    print(
      f"[UPDATE] id={product.get('id')} "
      f"'{name[:40]}...' category: {before} -> {new_category}"
    )

  save_products(products)
  print(f"[DONE] {updated_count} 件の商品カテゴリを更新しました。")


if __name__ == "__main__":
  main()


