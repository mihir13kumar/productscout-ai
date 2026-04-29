import httpx
import re
import logging
import traceback
from bs4 import BeautifulSoup

# Setup logging to file and console
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("scraper.log", mode="a", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("scraper")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}


async def scrape_product(url: str) -> str:
    """
    Scrapes product page using httpx + BeautifulSoup.
    """
    logger.info(f"Starting scrape for URL: {url}")
    
    try:
        async with httpx.AsyncClient(
            headers=HEADERS,
            follow_redirects=True,
            timeout=30.0,
        ) as client:
            logger.debug("Sending GET request...")
            response = await client.get(url)
            logger.info(f"Response status: {response.status_code}")
            logger.debug(f"Response headers: {dict(response.headers)}")
            response.raise_for_status()
            html = response.text
            logger.info(f"HTML received: {len(html)} chars")
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error {e.response.status_code}: {e}")
        raise
    except httpx.RequestError as e:
        logger.error(f"Request error: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during HTTP request: {e}")
        logger.error(traceback.format_exc())
        raise

    soup = BeautifulSoup(html, "html.parser")

    # Remove noise tags
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "iframe", "noscript"]):
        tag.decompose()

    if "amazon" in url:
        logger.info("Detected Amazon URL, using Amazon parser")
        result = _scrape_amazon(soup)
    elif "flipkart" in url:
        logger.info("Detected Flipkart URL, using Flipkart parser")
        result = _scrape_flipkart(soup)
    else:
        logger.info("Using generic parser")
        result = _scrape_generic(soup)

    logger.info(f"Scraping result length: {len(result)} chars")
    logger.debug(f"Scraping result preview: {result[:200]}")
    return result


def _scrape_amazon(soup: BeautifulSoup) -> str:
    text_parts = []

    selectors = {
        "Title": "#productTitle",
        "Price": ".a-price-whole, #priceblock_ourprice, #priceblock_dealprice, .apexPriceToPay",
        "Rating": "#acrPopover, #averageCustomerReviews",
        "Feature Bullets": "#feature-bullets",
        "Product Details": "#productDetails_techSpec_section_1, #productDetails_detailBullets_sections1",
        "Description": "#productDescription",
        "Reviews": "#cm-cr-dp-review-list",
    }

    for label, selector_str in selectors.items():
        selectors_list = [s.strip() for s in selector_str.split(",")]
        for sel in selectors_list:
            el = soup.select_one(sel)
            if el:
                text = re.sub(r'\s+', ' ', el.get_text()).strip()
                if text:
                    text_parts.append(f"[{label}]\n{text}")
                    logger.debug(f"  Amazon found [{label}]: {text[:80]}...")
                break

    if text_parts:
        return "\n\n".join(text_parts)
    logger.warning("Amazon selectors found nothing, falling back to generic")
    return _scrape_generic(soup)


def _scrape_flipkart(soup: BeautifulSoup) -> str:
    text_parts = []

    selectors = {
        "Title": ".B_NuCI, .yhB1nd, .KalC4f",
        "Price": "._30jeq3._16Jk6d, ._30jeq3, ._16Jk6d",
        "Rating": "._3LWZlK, ._2d4LTz",
        "Highlights": "._21Ahn-, ._2418kt, ._3k-BhJ",
        "Specifications": "._14cfVK, ._3k-BhJ, .col.col-9-12",
        "Description": "._1mXcCf, .RmoJbe",
        "Reviews": "._2sc7ZR, .t-ZTKy",
    }

    for label, selector_str in selectors.items():
        selectors_list = [s.strip() for s in selector_str.split(",")]
        for sel in selectors_list:
            el = soup.select_one(sel)
            if el:
                text = re.sub(r'\s+', ' ', el.get_text()).strip()
                if text:
                    text_parts.append(f"[{label}]\n{text}")
                    logger.debug(f"  Flipkart found [{label}]: {text[:80]}...")
                break

    if text_parts:
        return "\n\n".join(text_parts)
    logger.warning("Flipkart selectors found nothing, falling back to generic")
    return _scrape_generic(soup)


def _scrape_generic(soup: BeautifulSoup) -> str:
    """Fallback: grab all visible text from body."""
    text = soup.get_text(separator="\n")
    text = re.sub(r'\n{3,}', '\n\n', text)
    result = text[:8000].strip()
    logger.info(f"Generic scraper extracted {len(result)} chars")
    return result