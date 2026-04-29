from curl_cffi.requests import AsyncSession
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


async def scrape_product(url: str) -> str:
    """
    Scrapes product page using curl_cffi + BeautifulSoup.
    curl_cffi impersonates a real browser to bypass anti-bot systems like Akamai.
    """
    logger.info(f"Starting scrape for URL: {url}")
    
    try:
        async with AsyncSession() as session:
            logger.debug("Sending request using curl_cffi (impersonate='chrome124')...")
            # impersonate="chrome124" handles JA3 fingerprints, headers, and HTTP/2 settings automatically
            response = await session.get(
                url, 
                impersonate="chrome124",
                timeout=30.0,
                follow_redirects=True
            )
            
            logger.info(f"Response status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Failed to scrape. Status: {response.status_code}")
                # Log a bit of the response if it's an error
                logger.debug(f"Error body: {response.text[:500]}")
                raise Exception(f"Scraper blocked (Status {response.status_code}). Site might be detecting automation.")

            html = response.text
            logger.info(f"HTML received: {len(html)} chars")
    except Exception as e:
        logger.error(f"Error during scrape: {e}")
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