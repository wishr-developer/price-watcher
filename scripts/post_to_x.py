#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
X (Twitter) への自動投稿スクリプト

- data/products.json を読み込み
- 値下がり率が最大の「ベストディール」商品を 1 件選定
- 商品名 / 値下がり額 / 値下がり率 / サイトURL / ハッシュタグ を含む投稿文を生成
- tweepy を使って X API に投稿

事前準備:
- requirements.txt に tweepy が含まれていること
- 環境変数に以下が設定されていること
  - VERCEL_URL
  - X_API_KEY
  - X_API_SECRET
  - X_ACCESS_TOKEN
  - X_ACCESS_SECRET
"""

import json
import logging
import os
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import tweepy

BASE_DIR = Path(__file__).resolve().parents[1]
PRODUCTS_PATH = BASE_DIR / "data" / "products.json"
POSTED_LOG_PATH = BASE_DIR / "src" / "data" / "posted_log.json"


logging.basicConfig(
  level=logging.INFO,
  format="[%(asctime)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)


def load_products() -> List[Dict[str, Any]]:
  """products.json を読み込む"""
  if not PRODUCTS_PATH.exists():
    raise FileNotFoundError(f"products.json が見つかりません: {PRODUCTS_PATH}")

  with PRODUCTS_PATH.open("r", encoding="utf-8") as f:
    return json.load(f)


def load_posted_log() -> List[Dict[str, Any]]:
  """過去の投稿ログ（posted_log.json）を読み込む"""
  if not POSTED_LOG_PATH.exists():
    return []

  try:
    with POSTED_LOG_PATH.open("r", encoding="utf-8") as f:
      data = json.load(f)
      if isinstance(data, list):
        return data
      return []
  except Exception as e:
    logger.warning("posted_log.json の読み込みに失敗しました: %s", e)
    return []


def save_posted_log(entries: List[Dict[str, Any]]) -> None:
  """投稿ログを posted_log.json に書き込む"""
  POSTED_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
  with POSTED_LOG_PATH.open("w", encoding="utf-8") as f:
    json.dump(entries, f, ensure_ascii=False, indent=2)


def extract_asin(affiliate_url: str) -> Optional[str]:
  """URL から ASIN を抽出する（/dp/ または /gp/product/）"""
  if not affiliate_url:
    return None
  pattern = re.compile(r"/dp/([A-Z0-9]{10})|/gp/product/([A-Z0-9]{10})")
  match = pattern.search(affiliate_url)
  if not match:
    return None
  return match.group(1) or match.group(2)


def calc_discount_percent(product: Dict[str, Any]) -> Optional[float]:
  """商品ごとの値下がり率（%）を計算する。値下がりがない場合は None を返す。"""
  current_price = product.get("currentPrice")
  history = product.get("priceHistory") or []

  if current_price is None or not isinstance(history, list) or len(history) < 2:
    return None

  try:
    prev_price = float(history[-2]["price"])
    latest_price = float(current_price)
  except (KeyError, TypeError, ValueError):
    return None

  if prev_price <= 0:
    return None

  if latest_price >= prev_price:
    # 値下がりしていない
    return None

  discount_percent = (prev_price - latest_price) / prev_price * 100.0
  return discount_percent


def find_best_deal(products: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
  """
  値下がり率（percentChange）が最も高い商品を 1 件返す。
  - 値下がり率 <= 0 の商品は除外
  - ASIN が取れない商品も除外
  """
  best_product: Optional[Dict[str, Any]] = None
  best_percent: float = 0.0

  for product in products:
    affiliate_url = product.get("affiliateUrl") or ""
    asin = product.get("asin") or extract_asin(affiliate_url)
    if not asin:
      continue

    percent = calc_discount_percent(product)
    if percent is None:
      continue

    if percent > best_percent:
      best_percent = percent
      best_product = product

  if best_product is None or best_percent <= 0:
    return None

  # 見つかった商品に計算済みの percentChange を付与して返す
  best_product = dict(best_product)  # コピーして拡張
  best_product["__percentChange"] = best_percent
  return best_product


def build_site_url(asin: str) -> str:
  """
  サイトの URL を生成する。
  - VERCEL_URL 環境変数を使用
  - 形式: https://{VERCEL_URL}/products/{asin}
  """
  vercel_url = os.getenv("VERCEL_URL")
  if not vercel_url:
    raise RuntimeError("環境変数 VERCEL_URL が設定されていません。")

  # VERCEL_URL にスキームが含まれていない想定（例: example.vercel.app）
  base = vercel_url.strip().rstrip("/")
  if not base.startswith("http://") and not base.startswith("https://"):
    base = f"https://{base}"

  return f"{base}/products/{asin}"


def build_tweet_text(product: Dict[str, Any]) -> str:
  """
  商品情報からツイート文を生成する。
  - 商品名
  - 値下がり額
  - 値下がり率
  - サイトURL
  - ハッシュタグ
  """
  name = str(product.get("name", "不明な商品"))
  affiliate_url = product.get("affiliateUrl") or ""
  asin = product.get("asin") or extract_asin(affiliate_url)
  if not asin:
    raise RuntimeError("ASIN を取得できないため、ツイート用URLを生成できません。")

  history = product.get("priceHistory") or []
  current_price = float(product.get("currentPrice", 0))
  prev_price = float(history[-2]["price"]) if len(history) >= 2 else current_price

  diff = prev_price - current_price
  percent = float(product.get("__percentChange", 0.0))

  url = build_site_url(asin)

  # 商品名が長すぎる場合はトリム
  max_name_length = 60
  if len(name) > max_name_length:
    name = name[: max_name_length - 1] + "…"

  tweet = (
    f"📉本日のベストディール\n"
    f"{name}\n"
    f"価格: ¥{int(current_price):,}（-{int(diff):,}円 / -{percent:.1f}%）\n"
    f"{url}\n"
    f"#Amazon #TRENDIX #セール"
  )

  return tweet


def get_twitter_client() -> tweepy.API:
  """環境変数から認証情報を読み込み、tweepy クライアントを生成する。"""
  api_key = os.getenv("X_API_KEY")
  api_secret = os.getenv("X_API_SECRET")
  access_token = os.getenv("X_ACCESS_TOKEN")
  access_secret = os.getenv("X_ACCESS_SECRET")

  if not all([api_key, api_secret, access_token, access_secret]):
    raise RuntimeError(
      "X API の認証情報が不足しています。X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET を確認してください。"
    )

  auth = tweepy.OAuth1UserHandler(
    api_key,
    api_secret,
    access_token,
    access_secret,
  )
  api = tweepy.API(auth)
  return api


def is_recently_posted(asin: str, log_entries: List[Dict[str, Any]], hours: int = 24) -> bool:
  """指定した ASIN が直近 hours 時間以内に投稿されているかを判定する"""
  now = datetime.now(timezone.utc)
  cutoff = now - timedelta(hours=hours)

  for entry in log_entries:
    if entry.get("asin") != asin:
      continue
    ts_str = entry.get("timestamp")
    if not ts_str:
      continue
    try:
      ts = datetime.fromisoformat(ts_str)
    except ValueError:
      continue
    if ts.tzinfo is None:
      ts = ts.replace(tzinfo=timezone.utc)
    if ts >= cutoff:
      return True
  return False


def append_post_log(asin: str, log_entries: List[Dict[str, Any]], keep_hours: int = 48) -> List[Dict[str, Any]]:
  """
  新しい投稿をログに追加し、古いエントリをクリーンアップする。
  - keep_hours 時間より古いものは削除（デフォルト48時間）
  """
  now = datetime.now(timezone.utc)
  cutoff = now - timedelta(hours=keep_hours)

  cleaned: List[Dict[str, Any]] = []
  for entry in log_entries:
    ts_str = entry.get("timestamp")
    if not ts_str:
      continue
    try:
      ts = datetime.fromisoformat(ts_str)
    except ValueError:
      continue
    if ts.tzinfo is None:
      ts = ts.replace(tzinfo=timezone.utc)
    if ts >= cutoff:
      cleaned.append(entry)

  cleaned.append(
    {
      "asin": asin,
      "timestamp": now.isoformat(),
    }
  )
  return cleaned


def post_best_deal_to_x() -> None:
  """メインフロー: ベストディールを選定し、X に投稿する。"""
  try:
    products = load_products()
  except Exception as e:
    logger.error("商品データの読み込みに失敗しました: %s", e)
    return

  best_product = find_best_deal(products)
  if not best_product:
    logger.info("値下がり率が正のベストディール商品が見つかりませんでした。投稿をスキップします。")
    return

  affiliate_url = best_product.get("affiliateUrl") or ""
  asin = best_product.get("asin") or extract_asin(affiliate_url)
  if not asin:
    logger.error("ベストディール商品の ASIN を取得できませんでした。投稿を中止します。")
    return

  # 過去24時間の投稿履歴をチェック
  log_entries = load_posted_log()
  if is_recently_posted(asin, log_entries, hours=24):
    logger.info("ASIN %s は過去24時間以内に投稿済みのため、再投稿をスキップします。", asin)
    return

  try:
    tweet_text = build_tweet_text(best_product)
  except Exception as e:
    logger.error("ツイート文の生成に失敗しました: %s", e)
    return

  try:
    api = get_twitter_client()
  except Exception as e:
    logger.error("X API クライアントの初期化に失敗しました: %s", e)
    return

  try:
    logger.info("X へ投稿中: %s", tweet_text.replace("\n", " / "))
    api.update_status(status=tweet_text)
    logger.info("X への投稿が完了しました。")

    # 投稿成功時にログを更新（過去48時間分だけ保持）
    updated_log = append_post_log(asin, log_entries, keep_hours=48)
    save_posted_log(updated_log)

  except Exception as e:
    logger.error("X への投稿に失敗しました: %s", e)


if __name__ == "__main__":
  post_best_deal_to_x()


