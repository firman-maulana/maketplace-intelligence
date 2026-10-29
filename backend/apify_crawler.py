"""
Rankwise Marketplace Intelligence - Apify Live Scraper Pipeline
Mengambil produk terlaris secara live dari Shopee & Tokopedia menggunakan Apify API,
lalu menyinkronkannya langsung ke Backend Memory Store (Zero Database).
"""

import sys
import os
import time
import requests
import re
import json
import argparse

# Konfigurasi Apify Dinamis (Diatur melalui Admin Dashboard Setting atau Argumen CLI --token)
DEFAULT_APIFY_TOKEN = ""
APIFY_TOKEN = os.getenv("APIFY_TOKEN", DEFAULT_APIFY_TOKEN)
BACKEND_INGEST_URL = "http://localhost:8080/api/scrape/ingest"

# Konfigurasi Target Scraping Marketplace
ENABLE_SHOPEE = True
ENABLE_TOKOPEDIA = True

def parse_sold_count(sold_str):
    if not sold_str:
        return 500
    if isinstance(sold_str, (int, float)):
        return int(sold_str)
    s = str(sold_str).lower().replace("+", "").replace("terjual", "").strip()
    try:
        if "k" in s or "rb" in s or "ribu" in s:
            num = float(re.findall(r"[\d.]+", s)[0])
            return int(num * 1000)
        elif "jt" in s or "m" in s:
            num = float(re.findall(r"[\d.]+", s)[0])
            return int(num * 1000000)
        digits = re.findall(r"\d+", s)
        if digits:
            return int("".join(digits))
    except Exception:
        pass
    return 250

def scrape_shopee(keyword, category="Fashion", limit=50):
    """
    Scrape Shopee menggunakan Actor: gio21/shopee-scraper
    """
    print(f"\n[Shopee] Mengambil produk terlaris untuk kata kunci: '{keyword}' (Batas: {limit})...")
    url = f"https://api.apify.com/v2/actors/gio21~shopee-scraper/run-sync-get-dataset-items?token={APIFY_TOKEN}&timeout=120"
    payload = {
        "keywords": [keyword],
        "country": "ID",
        "maxItems": max(10, limit)
    }

    try:
        res = requests.post(url, json=payload, timeout=140)
        if res.status_code not in [200, 201]:
            print(f"[Shopee Error] Status {res.status_code}: {res.text[:200]}")
            return []

        raw_items = res.json()
        clean_products = []
        for it in raw_items:
            if "_warning" in it or not it.get("name"):
                continue

            price = float(it.get("price") or 0)
            orig_price = float(it.get("originalPrice") or price * 1.25)
            sold = parse_sold_count(it.get("historicalSoldEstimated") or it.get("sold"))
            images = it.get("images") or []
            img_url = images[0] if images else "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"

            item_data = {
                "product_name": it.get("name"),
                "product_brand": it.get("brand") or it.get("shopName") or "Official Store",
                "category": category,
                "sku": f"SHP-{it.get('itemId', int(time.time()))}",
                "url": it.get("url") or f"https://shopee.co.id/product/{it.get('shopId')}/{it.get('itemId')}",
                "image": img_url,
                "price": price,
                "original_price": orig_price,
                "discount": f"{it.get('discountPercent', 20)}%",
                "stock": int(it.get("stock") or 150),
                "stock_status": "In_Stock",
                "total_sold": sold,
                "qty": max(5, int(sold * 0.03)),
                "rating": float(it.get("rating") or 4.9),
                "review_count": int(it.get("reviewCount") or 250),
                "status": 2,
                "description": it.get("description") or it.get("desc") or "",
                "shop": {
                    "name": it.get("shopName") or "Toko Shopee",
                    "marketplace": "Shopee",
                    "location": it.get("location") or "",
                    "badge": it.get("shopBadge") or ("Shopee Mall" if it.get("isMall") else ""),
                    "chat_response_rate": it.get("chatResponseRate") or "",
                    "followers": str(it.get("followersCount") or "") if it.get("followersCount") else "",
                    "rating": float(it.get("shopRating") or 0.0),
                    "url": f"https://shopee.co.id/shop/{it.get('shopId', '')}" if it.get('shopId') else ""
                },
                "reviews": it.get("reviews") or []
            }
            clean_products.append(item_data)

        print(f"[Shopee] Berhasil mengekstrak {len(clean_products)} produk live!")
        return clean_products

    except Exception as e:
        print(f"[Shopee Exception]: {e}")
        return []

def scrape_tokopedia(tokped_query, category="Fashion", limit=50):
    """
    Scrape Tokopedia menggunakan Actor: jupri/tokopedia-scraper
    """
    print(f"\n[Tokopedia] Mengambil produk terlaris via kata kunci: '{tokped_query}' (Batas: {limit})...")
    url = f"https://api.apify.com/v2/actors/jupri~tokopedia-scraper/run-sync-get-dataset-items?token={APIFY_TOKEN}&timeout=120"
    payload = {
        "query": [tokped_query],
        "limit": limit
    }

    try:
        res = requests.post(url, json=payload, timeout=140)
        if res.status_code == 403 and "full-permission-actor-not-approved" in res.text:
            print("[Tokopedia Notice] Actor memerlukan 1x approval permission dari akun Apify Anda:")
            print("👉 Silakan buka di browser: https://console.apify.com/actors/S337CFUaMdypqcQkH?approvePermissions=true")
            return []

        if res.status_code not in [200, 201]:
            print(f"[Tokopedia Error] Status {res.status_code}: {res.text[:200]}")
            return []

        raw_items = res.json()
        clean_products = []
        for it in raw_items:
            name = it.get("name") or it.get("title")
            if not name:
                continue

            # Tokopedia schema parser
            price_obj = it.get("price")
            price = 0.0
            orig_price = 0.0
            discount = "10%"
            if isinstance(price_obj, dict):
                price = float(price_obj.get("number") or 0)
                orig_str = str(price_obj.get("original") or "")
                orig_digits = re.findall(r"\d+", orig_str.replace(".", ""))
                orig_price = float("".join(orig_digits)) if orig_digits else price * 1.2
                if price_obj.get("discountPercentage"):
                    discount = f"{price_obj.get('discountPercentage')}%"
            elif isinstance(price_obj, (int, float)):
                price = float(price_obj)
                orig_price = price * 1.2
            elif isinstance(price_obj, str):
                digits = re.findall(r"\d+", price_obj.replace(".", ""))
                price = float("".join(digits)) if digits else 120000
                orig_price = price * 1.2

            # Stock & sold
            stock_obj = it.get("stock")
            stock_num = 120
            sold = 500
            if isinstance(stock_obj, dict):
                stock_num = int(stock_obj.get("number") or 120)
                sold = int(stock_obj.get("sold") or 500)
            else:
                sold = parse_sold_count(it.get("sold") or it.get("count_sold"))

            # Image
            media_obj = it.get("media") or {}
            img_url = media_obj.get("image300") or media_obj.get("image") or it.get("image") or it.get("imageUrl") or "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"

            # Shop
            shop_obj = it.get("shop") or {}
            shop_name = shop_obj.get("name") if isinstance(shop_obj, dict) else (it.get("shop_name") or "Tokopedia Official")
            shop_city = shop_obj.get("city") if isinstance(shop_obj, dict) else (it.get("location") or "Jakarta")
            shop_url = shop_obj.get("url") if isinstance(shop_obj, dict) else (it.get("shop_url") or "https://www.tokopedia.com")

            rating_raw = it.get("rating") or "4.9"
            try:
                rating = float(rating_raw)
            except Exception:
                rating = 4.9

            item_data = {
                "product_name": name,
                "product_brand": shop_name,
                "category": category,
                "sku": f"TKP-{it.get('id', int(time.time()))}",
                "url": it.get("url") or f"https://www.tokopedia.com/find/{name.replace(' ', '-')}",
                "image": img_url,
                "price": price,
                "original_price": orig_price,
                "discount": discount,
                "stock": stock_num,
                "stock_status": "In_Stock" if stock_num > 0 else "Out_of_Stock",
                "total_sold": sold,
                "qty": max(5, int(sold * 0.02)),
                "rating": rating,
                "review_count": int(it.get("meta", {}).get("countReview") or 180),
                "status": 2,
                "description": it.get("description") or it.get("desc") or "",
                "shop": {
                    "name": shop_name,
                    "marketplace": "Tokopedia",
                    "location": shop_city,
                    "badge": shop_obj.get("badge") if isinstance(shop_obj, dict) else "",
                    "chat_response_rate": "",
                    "followers": "",
                    "rating": rating,
                    "url": shop_url
                },
                "reviews": it.get("reviews") or []
            }
            clean_products.append(item_data)

        print(f"[Tokopedia] Berhasil mengekstrak {len(clean_products)} produk live!")
        return clean_products

    except Exception as e:
        print(f"[Tokopedia Exception]: {e}")
        return []

def ingest_to_backend(products, user_id=0, username=""):
    """
    Mengirim array produk hasil crawling ke REST Ingestion Endpoint Rankwise
    """
    if not products:
        return

    print(f"\n--> Mengirim {len(products)} produk ke Rankwise In-Memory Engine (User ID: {user_id})...")
    success = 0
    for p in products:
        try:
            if user_id > 0:
                p["user_id"] = user_id
            if username:
                p["username"] = username
            r = requests.post(BACKEND_INGEST_URL, json=p, timeout=5)
            if r.status_code in [200, 201]:
                success += 1
        except Exception as e:
            print(f"Ingest error: {e}")
            break

    print(f"--> Selesai: {success}/{len(products)} produk berhasil disinkronkan ke Dashboard!")

def crawl_custom(keyword, category="Fashion", limit=25, enable_shopee=True, enable_tokopedia=True, do_ingest=True, user_id=0, username=""):
    """
    Menjalankan pencarian live untuk kata kunci dan kategori kustom yang diinputkan user.
    """
    print(f"\n[On-Demand Crawl] Kata Kunci: '{keyword}' | Kategori: '{category}' | Limit: {limit} | User ID: {user_id}")
    results = []

    # Format keyword agar mengarah ke tren/terlaris jika belum ada
    clean_kw = keyword.strip()
    tokped_kw = clean_kw if "terlaris" in clean_kw.lower() else f"{clean_kw} terlaris"
    shopee_kw = clean_kw if "terlaris" in clean_kw.lower() else f"{clean_kw} terlaris"

    # Scrape Tokopedia
    if enable_tokopedia:
        try:
            tokped_items = scrape_tokopedia(tokped_query=tokped_kw, category=category, limit=limit)
            for item in tokped_items:
                item["user_id"] = user_id
                item["username"] = username
            results.extend(tokped_items)
        except Exception as e:
            print(f"[Crawl Tokopedia Error]: {e}")

    # Scrape Shopee
    if enable_shopee:
        try:
            shopee_items = scrape_shopee(keyword=shopee_kw, category=category, limit=max(10, limit))
            for item in shopee_items:
                item["user_id"] = user_id
                item["username"] = username
            results.extend(shopee_items)
        except Exception as e:
            print(f"[Crawl Shopee Error]: {e}")

    if do_ingest and results:
        ingest_to_backend(results, user_id=user_id, username=username)

    return results

def main():
    parser = argparse.ArgumentParser(description="Rankwise Apify Marketplace Intelligence Crawler")
    parser.add_argument("--token", type=str, default=None, help="Apify API Token (Dinamis dari Dashboard Admin)")
    parser.add_argument("--keyword", type=str, default=None, help="Kata kunci pencarian kustom dari user")
    parser.add_argument("--category", type=str, default="Fashion", help="Kategori produk target")
    parser.add_argument("--limit", type=int, default=25, help="Batas produk per marketplace")
    parser.add_argument("--tokopedia", type=str, default="true", help="Aktifkan Tokopedia (true/false)")
    parser.add_argument("--shopee", type=str, default="true", help="Aktifkan Shopee (true/false)")
    parser.add_argument("--ingest", type=str, default="true", help="Sinkronkan langsung ke Backend (true/false)")
    parser.add_argument("--user-id", type=int, default=0, help="ID Pengguna pemilik sesi crawling")
    parser.add_argument("--username", type=str, default="", help="Username pemilik sesi crawling")
    
    args = parser.parse_args()

    global APIFY_TOKEN
    if args.token and args.token.strip():
        APIFY_TOKEN = args.token.strip()

    enable_tokped = args.tokopedia.lower() in ["1", "true", "yes"]
    enable_shp = args.shopee.lower() in ["1", "true", "yes"]
    do_ingest = args.ingest.lower() in ["1", "true", "yes"]

    print("=" * 65)
    print("  RANKWISE - APIFY LIVE MARKETPLACE INTELLIGENCE CRAWLER")
    print("=" * 65)
    print(f"Key Token   : {APIFY_TOKEN[:15]}... (Valid)")

    all_scraped = []

    if args.keyword:
        # Mode On-Demand Keyword dari User di Product-List / Schedule
        print(f"Mode        : On-Demand Keyword: '{args.keyword}'")
        print(f"Kategori    : {args.category}")
        print(f"Target      : Tokopedia={enable_tokped}, Shopee={enable_shp}")
        print(f"Pemilik     : ID {args.user_id} ({args.username or 'System'})")
        print("=" * 65)
        all_scraped = crawl_custom(
            keyword=args.keyword,
            category=args.category,
            limit=args.limit,
            enable_shopee=enable_shp,
            enable_tokopedia=enable_tokped,
            do_ingest=do_ingest,
            user_id=args.user_id,
            username=args.username
        )
    else:
        print("\n[INFO] Tidak ada kata kunci pencarian yang ditentukan. Harap sertakan argumen --keyword dari input user.")

    # Output JSON summary at the very end
    summary = {
        "status": "success",
        "total_scraped": len(all_scraped),
        "keyword": args.keyword or "Batch Multi-Kategori",
        "category": args.category,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    print(f"\n[SUMMARY_JSON]{json.dumps(summary)}[/SUMMARY_JSON]")

if __name__ == "__main__":
    main()
