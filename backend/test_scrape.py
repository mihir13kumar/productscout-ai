"""
Standalone test script to debug scraping issues.
Run: python test_scrape.py
"""
import asyncio
import httpx
from bs4 import BeautifulSoup

URL = "https://www.flipkart.com/motorola-g96-5g-pantone-ashleigh-blue-128-gb/p/itm93452c0761719?pid=MOBHB3SZ2ZUQQQ9U"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}


async def test():
    print("=" * 60)
    print("TESTING SCRAPE")
    print("=" * 60)
    print(f"URL: {URL}\n")

    try:
        async with httpx.AsyncClient(
            headers=HEADERS,
            follow_redirects=True,
            timeout=30.0,
        ) as client:
            print("[1] Sending GET request...")
            response = await client.get(URL)
            print(f"[2] Status code: {response.status_code}")
            print(f"[3] Final URL: {response.url}")
            print(f"[4] Content-Type: {response.headers.get('content-type', 'N/A')}")
            print(f"[5] HTML length: {len(response.text)} chars")

            if response.status_code != 200:
                print(f"\n[ERROR] Non-200 status: {response.status_code}")
                print(f"Response body preview:\n{response.text[:500]}")
                return

            html = response.text
            print(f"\n[6] HTML preview (first 300 chars):\n{html[:300]}\n")

    except Exception as e:
        print(f"\n[FATAL] HTTP request failed: {type(e).__name__}: {e}")
        return

    soup = BeautifulSoup(html, "html.parser")

    # Remove noise
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "iframe", "noscript"]):
        tag.decompose()

    # Check page title
    title_tag = soup.find("title")
    print(f"[7] Page <title>: {title_tag.get_text() if title_tag else 'NOT FOUND'}")

    # Try generic extraction
    body_text = soup.get_text(separator="\n")
    clean_text = "\n".join(line.strip() for line in body_text.split("\n") if line.strip())
    print(f"\n[8] Total extracted text: {len(clean_text)} chars")
    print(f"\n[9] First 500 chars of extracted text:\n{clean_text[:500]}")
    print(f"\n{'=' * 60}")

    if len(clean_text) >= 50:
        print("RESULT: Scraping WOULD SUCCEED (>= 50 chars extracted)")
    else:
        print("RESULT: Scraping WOULD FAIL (< 50 chars)")


if __name__ == "__main__":
    asyncio.run(test())
