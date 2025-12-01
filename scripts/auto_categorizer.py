#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
AI自動分類スクリプト（自己学習型カテゴリ分類）

data/products.json を読み込み、カテゴリが「その他」または未設定の商品だけを抽出し、
src/data/category_map.json に定義されたキーワードマップを用いてカテゴリを自動付与します。

外部APIやLLMには依存せず、既存のデータのみを用いてスコアリング分類を行います。
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Mapping

BASE_DIR = Path(__file__).resolve().parents[1]
PRODUCTS_PATH = BASE_DIR / "data" / "products.json"
CATEGORY_MAP_PATH = BASE_DIR / "src" / "data" / "category_map.json"


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


def load_category_map() -> Mapping[str, List[str]]:
  """カテゴリマップ（category_map.json）を読み込む"""
  if not CATEGORY_MAP_PATH.exists():
    raise FileNotFoundError(f"category_map.json が見つかりません: {CATEGORY_MAP_PATH}")

  with CATEGORY_MAP_PATH.open("r", encoding="utf-8") as f:
    data = json.load(f)

  # 想定形式: { "カテゴリ名": ["キーワード1", "キーワード2", ...], ... }
  if not isinstance(data, dict):
    raise ValueError("category_map.json の形式が不正です（dict ではありません）")
  return data


def classify_by_scoring(product_name: str, category_map: Mapping[str, List[str]]) -> str:
  """
  既存の category_map.json を用いてスコアリング分類を行う。

  スコア = Σ (キーワードの出現回数 × キーワード長の重み)
  - 商品名内に長いキーワードが複数回出現するカテゴリほどスコアが高くなる（長いフレーズを優遇）。
  - 1カテゴリ内の全キーワードについてスコアを合算し、最大スコアのカテゴリを採用。
  - 「その他」はスコアリング対象から一旦外し、他カテゴリがマッチしない場合のみフォールバックとして使用する。
  """
  name = product_name or ""
  if not name:
    return "その他"

  name_norm = name.lower()

  best_category = "その他"
  best_score = 0.0

  for category, keywords in category_map.items():
    # 「その他」はフォールバック用にのみ使用し、ここではスコアリング対象から除外
    if category == "その他":
      continue

    if not isinstance(keywords, list):
      continue

    score = 0.0
    for kw in keywords:
      if not kw:
        continue
      kw_str = str(kw)
      # キーワードも小文字化して部分一致を取る（日本語も一応lower()で揃える）
      kw_norm = kw_str.lower()
      # あまりに短いキーワード（1〜2文字）はノイズになりやすいので無視
      if len(kw_norm) <= 2:
        continue
      if kw_norm in name_norm:
        # 出現回数を数える（オーバーラップは無視）
        occurrences = name_norm.count(kw_norm)
        # キーワード長に基づく重み（長いフレーズを少し強めに評価）
        base_len = len(kw_norm)
        length_weight = base_len ** 1.2
        score += occurrences * length_weight

    if score > best_score:
      best_score = score
      best_category = category

  # 1つもマッチしなければ「その他」
  if best_score <= 0:
    return "その他"

  return best_category


def main() -> None:
  products = load_products()
  category_map = load_category_map()
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
    new_category = classify_by_scoring(name, category_map)
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


