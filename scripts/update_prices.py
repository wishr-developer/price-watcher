#!/usr/bin/env python3
"""
Amazon商品の価格をスクレイピングして更新するスクリプト
取得失敗時やURLがダミーの場合は、ランダム変動をフォールバックとして使用
"""

import json
import random
import re
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# プロジェクトルートのパスを取得
PROJECT_ROOT = Path(__file__).parent.parent
DATA_FILE = PROJECT_ROOT / "data" / "products.json"

# User-Agentヘッダー（ブラウザからのアクセスに見せかける）
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}


def extract_price_from_html(html: str) -> int | None:
    """
    HTMLから価格を抽出する
    Amazonの価格表示パターンを複数試行
    """
    soup = BeautifulSoup(html, "html.parser")

    # パターン1: id="priceblock_ourprice" または id="priceblock_dealprice"
    price_element = soup.find(id="priceblock_ourprice") or soup.find(id="priceblock_dealprice")
    if price_element:
        price_text = price_element.get_text(strip=True)
        price = parse_price(price_text)
        if price:
            return price

    # パターン2: class="a-price-whole"
    price_element = soup.find(class_="a-price-whole")
    if price_element:
        price_text = price_element.get_text(strip=True)
        price = parse_price(price_text)
        if price:
            return price

    # パターン3: span.a-price-whole を含む要素を探す
    price_elements = soup.find_all("span", class_="a-price-whole")
    for element in price_elements:
        price_text = element.get_text(strip=True)
        price = parse_price(price_text)
        if price:
            return price

    # パターン4: data-a-color="price" を含む要素
    price_element = soup.find(attrs={"data-a-color": "price"})
    if price_element:
        price_text = price_element.get_text(strip=True)
        price = parse_price(price_text)
        if price:
            return price

    return None


def parse_price(price_text: str) -> int | None:
    """
    価格テキストから数値を抽出する
    "¥248,000" -> 248000
    """
    # カンマと通貨記号を除去して数値を抽出
    price_match = re.search(r"[\d,]+", price_text.replace(",", ""))
    if price_match:
        try:
            return int(price_match.group().replace(",", ""))
        except ValueError:
            return None
    return None


def scrape_price(url: str) -> int | None:
    """
    Amazon商品ページから価格をスクレイピングする
    成功時は価格を返し、失敗時はNoneを返す
    """
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code == 200:
            price = extract_price_from_html(response.text)
            return price
        else:
            print(f"警告: {url} へのアクセスが失敗しました (ステータスコード: {response.status_code})")
            return None
    except requests.exceptions.RequestException as e:
        print(f"警告: {url} へのアクセス中にエラーが発生しました: {e}")
        return None
    except Exception as e:
        print(f"警告: 価格抽出中にエラーが発生しました: {e}")
        return None


def fallback_random_price(current_price: int) -> int:
    """
    スクレイピング失敗時のフォールバック: ランダムに価格を変動させる
    """
    price_change = random.randint(-100, 100)
    new_price = max(1000, current_price + price_change)  # 最低価格を1000円に設定
    return new_price


def update_prices():
    """商品価格を更新する（CI環境では先頭50件のみ処理）"""
    print("INFO: 価格更新を開始します（CIタイムアウト防止のため先頭50件に制限）")

    # JSONファイルを読み込む
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        products = json.load(f)

    # CIタイムアウト対策: 先頭50件のみ処理
    limited_products = products[:50]

    # 各商品の価格を更新
    for product in limited_products:
        old_price = product["currentPrice"]
        new_price = None

        # スクレイピングを試行
        url = product.get("affiliateUrl", "")
        if url and url.startswith("https://www.amazon.co.jp"):
            print(f"スクレイピング中: {product['name']} ({url})")
            new_price = scrape_price(url)
            
            # サーバー負荷を考慮してリクエスト間に2秒待機
            time.sleep(2)
        else:
            print(f"スキップ: {product['name']} (URLがダミーまたは無効)")

        # スクレイピング失敗時はフォールバック
        if new_price is None:
            print(f"フォールバック: {product['name']} の価格をランダム変動で更新")
            new_price = fallback_random_price(old_price)

        # 現在価格を更新
        product["currentPrice"] = new_price

        # 価格履歴に新しいエントリを追加
        new_entry = {
            "date": datetime.now(timezone.utc).isoformat(),
            "price": new_price,
        }
        product["priceHistory"].append(new_entry)

        # 価格履歴が長すぎる場合は古いものを削除（最新30件を保持）
        if len(product["priceHistory"]) > 30:
            product["priceHistory"] = product["priceHistory"][-30:]

        print(f"更新完了: {product['name']} - ¥{old_price:,} -> ¥{new_price:,}")

    # JSONファイルに保存（全商品を書き戻す）
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print(f"価格を更新しました: {datetime.now().isoformat()}")


if __name__ == "__main__":
    update_prices()

