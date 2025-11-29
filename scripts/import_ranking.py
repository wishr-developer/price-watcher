#!/usr/bin/env python3
"""
Amazonランキングページから商品を自動収集し、アフィリエイトIDを自動付与するスクリプト
categories.txtのURLを読み込み、各ページから商品情報を抽出してproducts.jsonに追記する
"""

import json
import random
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

# ============================================================================
# 設定値
# ============================================================================

# アフィリエイトID（ここにあなたのAmazonアソシエイトIDを記入してください）
ASSOCIATE_TAG = "xiora-22"

# プロジェクトルートのパスを取得
PROJECT_ROOT = Path(__file__).parent.parent
DATA_FILE = PROJECT_ROOT / "data" / "products.json"
CATEGORIES_FILE = PROJECT_ROOT / "scripts" / "categories.txt"

# User-Agentヘッダー（ブラウザからのアクセスに見せかける）
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}


# ============================================================================
# ユーティリティ関数
# ============================================================================

def random_sleep(min_seconds: float = 2.0, max_seconds: float = 5.0):
    """
    ランダムな時間待機する（サーバー負荷対策）
    """
    sleep_time = random.uniform(min_seconds, max_seconds)
    time.sleep(sleep_time)


def extract_asin_from_url(url: str) -> str | None:
    """
    URLからASINを抽出する
    """
    # /dp/ASIN パターン
    match = re.search(r"/dp/([A-Z0-9]{10})", url)
    if match:
        return match.group(1)
    
    # /gp/product/ASIN パターン
    match = re.search(r"/gp/product/([A-Z0-9]{10})", url)
    if match:
        return match.group(1)
    
    return None


def get_existing_asins(products: list) -> set[str]:
    """
    既存の商品データからASINのセットを取得する
    """
    asins = set()
    
    for product in products:
        affiliate_url = product.get("affiliateUrl", "")
        if affiliate_url:
            asin = extract_asin_from_url(affiliate_url)
            if asin:
                asins.add(asin)
    
    return asins


def get_next_id(products: list) -> str:
    """
    既存の商品IDから次のIDを生成する
    """
    if not products:
        return "1"

    # 既存のIDから最大値を取得
    max_id = 0
    for product in products:
        try:
            product_id = int(product.get("id", "0"))
            max_id = max(max_id, product_id)
        except ValueError:
            continue

    return str(max_id + 1)


def build_affiliate_url(asin: str) -> str:
    """
    アフィリエイトリンクを生成する
    """
    if ASSOCIATE_TAG == "YOUR_ID_HERE":
        # アフィリエイトIDが設定されていない場合は通常のURL
        return f"https://www.amazon.co.jp/dp/{asin}"
    else:
        return f"https://www.amazon.co.jp/dp/{asin}?tag={ASSOCIATE_TAG}"


# ============================================================================
# スクレイピング関数
# ============================================================================

def extract_product_name(element) -> str | None:
    """
    商品コンテナ要素から商品名を抽出する
    """
    # パターン1: imgタグのalt属性
    img_tag = element.find("img")
    if img_tag and img_tag.get("alt"):
        name = img_tag.get("alt", "").strip()
        if name and len(name) > 3:
            return name
    
    # パターン2: h2タグ内のテキスト
    h2_tag = element.find("h2")
    if h2_tag:
        name = h2_tag.get_text(strip=True)
        if name and len(name) > 3:
            return name
    
    # パターン3: aタグ内のテキスト（商品リンク）
    link_tag = element.find("a", href=re.compile(r"/dp/|/gp/product/"))
    if link_tag:
        # spanタグ内のテキストを優先
        span_tag = link_tag.find("span")
        if span_tag:
            name = span_tag.get_text(strip=True)
            if name and len(name) > 3:
                return name
        else:
            name = link_tag.get_text(strip=True)
            if name and len(name) > 3:
                return name
    
    # パターン4: class="a-text-normal" を含む要素
    text_elements = element.find_all(class_=re.compile(r"a-text-normal"))
    for text_elem in text_elements:
        text = text_elem.get_text(strip=True)
        if text and len(text) > 10:  # 商品名らしい長さのテキスト
            return text
    
    # パターン5: class="zg-item" や "zg-title" を含む要素（ランキングページ用）
    title_elements = element.find_all(class_=re.compile(r"zg-title|zg-item"))
    for title_elem in title_elements:
        text = title_elem.get_text(strip=True)
        if text and len(text) > 3:
            return text
    
    return None


def extract_image_url(element, base_url: str) -> str:
    """
    商品コンテナ要素から画像URLを抽出する
    """
    img_tag = element.find("img")
    if img_tag:
        # data-src属性を優先（遅延読み込み対応）
        image_url = img_tag.get("data-src") or img_tag.get("src")
        if image_url:
            # 相対URLの場合は絶対URLに変換
            if image_url.startswith("//"):
                image_url = "https:" + image_url
            elif image_url.startswith("/"):
                image_url = urljoin(base_url, image_url)
            return image_url
    
    # デフォルト画像
    return "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop"


def extract_product_from_element(element, base_url: str) -> dict | None:
    """
    商品コンテナ要素から商品情報を抽出する
    """
    try:
        # ASINを取得
        asin = element.get("data-asin")
        if not asin or asin.strip() == "":
            # data-asin属性がない場合は、リンクからASINを抽出
            link_tag = element.find("a", href=re.compile(r"/dp/|/gp/product/"))
            if link_tag:
                href = link_tag.get("href", "")
                asin = extract_asin_from_url(href)
                if not asin:
                    return None
            else:
                return None

        # 商品名を抽出
        name = extract_product_name(element)
        if not name:
            return None

        # 画像URLを抽出
        image_url = extract_image_url(element, base_url)

        # 価格は取得できない場合が多いため、0円として設定
        # （後続の価格更新スクリプトで補正される）
        price = 0

        return {
            "asin": asin,
            "name": name,
            "image_url": image_url,
            "price": price,
        }

    except Exception as e:
        print(f"  警告: 商品情報の抽出中にエラーが発生しました: {e}")
        return None


def scrape_ranking_page(url: str) -> list[dict]:
    """
    ランキングページから商品情報を抽出する
    """
    products = []
    
    try:
        print(f"  アクセス中: {url}")
        response = requests.get(url, headers=HEADERS, timeout=15)
        
        if response.status_code != 200:
            print(f"  エラー: ステータスコード {response.status_code}")
            return products

        soup = BeautifulSoup(response.text, "html.parser")
        
        # 複数のパターンで商品コンテナを探す
        product_elements = []
        
        # パターン1: div[data-asin] 属性を持つ要素
        elements_1 = soup.find_all("div", attrs={"data-asin": True})
        product_elements.extend(elements_1)
        
        # パターン2: div.zg-grid-general-faceout（ランキングページ用）
        elements_2 = soup.find_all("div", class_=re.compile(r"zg-grid-general-faceout|zg-item"))
        product_elements.extend(elements_2)
        
        # パターン3: li.zg-item-immersion（ランキングページ用）
        elements_3 = soup.find_all("li", class_=re.compile(r"zg-item-immersion"))
        product_elements.extend(elements_3)
        
        # 重複を除去（同じASINを持つ要素を統合）
        seen_asins = set()
        unique_elements = []
        for element in product_elements:
            asin = element.get("data-asin")
            if not asin:
                # data-asinがない場合は、リンクからASINを抽出
                link_tag = element.find("a", href=re.compile(r"/dp/|/gp/product/"))
                if link_tag:
                    href = link_tag.get("href", "")
                    asin = extract_asin_from_url(href)
            
            if asin and asin not in seen_asins:
                seen_asins.add(asin)
                unique_elements.append(element)
        
        print(f"  {len(unique_elements)}件の商品コンテナを発見")
        
        for element in unique_elements:
            product_info = extract_product_from_element(element, url)
            if product_info:
                products.append(product_info)

        print(f"  {len(products)}件の商品情報を抽出しました")

    except requests.exceptions.RequestException as e:
        print(f"  エラー: リクエスト中にエラーが発生しました: {e}")
    except Exception as e:
        print(f"  エラー: 予期しないエラーが発生しました: {e}")

    return products


# ============================================================================
# メイン処理
# ============================================================================

def import_ranking():
    """ランキングページから商品をインポートする"""
    
    # アフィリエイトIDの確認
    if ASSOCIATE_TAG == "YOUR_ID_HERE":
        print("⚠️  警告: ASSOCIATE_TAGが設定されていません")
        print("   スクリプトの冒頭で ASSOCIATE_TAG を設定してください")
        print("   現在は通常のURLで登録されます\n")
    
    # categories.txtが存在するか確認
    if not CATEGORIES_FILE.exists():
        print(f"エラー: {CATEGORIES_FILE} が見つかりません")
        print("categories.txtを作成し、1行に1つずつAmazonランキングURLを記入してください")
        return

    # 既存の商品データを読み込む
    if DATA_FILE.exists():
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            products = json.load(f)
    else:
        products = []

    # 既存のASINセットを取得（重複チェック用）
    existing_asins = get_existing_asins(products)

    # categories.txtを読み込む
    with open(CATEGORIES_FILE, "r", encoding="utf-8") as f:
        urls = [line.strip() for line in f if line.strip() and not line.strip().startswith("#")]

    if not urls:
        print("categories.txtにURLが記入されていません")
        return

    print(f"{len(urls)}件のランキングページを処理します...\n")

    total_added = 0
    total_skipped = 0
    total_failed = 0

    # 各URLを処理
    for i, url in enumerate(urls, 1):
        print(f"[{i}/{len(urls)}] 処理中: {url}")

        # ランキングページから商品を抽出
        scraped_products = scrape_ranking_page(url)

        if not scraped_products:
            print(f"  スキップ: 商品が見つかりませんでした")
            total_failed += 1
            if i < len(urls):  # 最後のURLの後は待機しない
                random_sleep(2, 5)
            continue

        # 各商品を登録
        for product_info in scraped_products:
            asin = product_info["asin"]

            # 重複チェック（ASINベース）
            if asin in existing_asins:
                print(f"  スキップ: {product_info['name'][:50]}... (既に登録済み: ASIN={asin})")
                total_skipped += 1
                continue

            # アフィリエイトリンクを生成
            affiliate_url = build_affiliate_url(asin)

            # 新しい商品データを作成
            new_id = get_next_id(products)
            new_product = {
                "id": new_id,
                "name": product_info["name"],
                "currentPrice": product_info["price"],
                "priceHistory": [
                    {
                        "date": datetime.now(timezone.utc).isoformat(),
                        "price": product_info["price"],
                    }
                ],
                "affiliateUrl": affiliate_url,
                "imageUrl": product_info["image_url"],
            }

            products.append(new_product)
            existing_asins.add(asin)  # 重複チェック用セットに追加
            total_added += 1

            print(f"  ✓ 追加: {product_info['name'][:50]}... (ASIN={asin})")

        # サーバー負荷を考慮してランダムに2〜5秒待機
        if i < len(urls):  # 最後のURLの後は待機しない
            random_sleep(2, 5)

    # JSONファイルに保存
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    # ログ出力
    print(f"\n{'='*60}")
    print(f"処理完了")
    print(f"{'='*60}")
    print(f"新商品を {total_added} 件追加しました")
    print(f"スキップ（重複）: {total_skipped} 件")
    print(f"失敗: {total_failed} 件")
    print(f"合計: {len(products)} 件の商品が登録されています")
    print(f"{'='*60}")


if __name__ == "__main__":
    import_ranking()
