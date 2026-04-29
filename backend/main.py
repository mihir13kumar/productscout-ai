from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from scraper import scrape_product
from chain import streaming_chain, title_chain
import asyncio
import json
import logging
import traceback

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("server.log", mode="a", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("server")

app = FastAPI(title="ProductScout API")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache scraped product data per URL (in-memory, session-level)
product_cache: dict[str, str] = {}


class ChatRequest(BaseModel):
    url: str
    question: str
    session_id: str = "default"


class ScrapeRequest(BaseModel):
    url: str


@app.post("/scrape")
async def scrape_endpoint(req: ScrapeRequest):
    """Scrape product page and cache the result."""
    logger.info(f"=== /scrape called with URL: {req.url}")
    try:
        if req.url in product_cache:
            logger.info("Cache hit — returning cached data")
            return {"status": "cached", "preview": product_cache[req.url][:300]}

        logger.info("Cache miss — starting scrape...")
        data = await scrape_product(req.url)
        logger.info(f"Scrape returned {len(data) if data else 0} chars")

        if not data or len(data) < 50:
            logger.error(f"Scrape result too short ({len(data) if data else 0} chars)")
            raise HTTPException(status_code=422, detail="Could not extract product data from URL.")

        product_cache[req.url] = data
        logger.info("Scrape successful, data cached")
        return {"status": "ok", "preview": data[:300]}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"SCRAPE ENDPOINT ERROR: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/title")
async def generate_title(req: ChatRequest):
    logger.info(f"=== /chat/title called for URL: {req.url}")
    try:
        # Get or fetch product data
        if req.url not in product_cache:
            data = await scrape_product(req.url)
            if data and len(data) >= 50:
                product_cache[req.url] = data
        
        product_data = product_cache.get(req.url, "No data")
        preview = product_data[:2000] if product_data else "No data"
        
        title = title_chain.invoke({
            "product_data": preview,
            "question": req.question
        })
        
        return {"title": title.strip()}
    except Exception as e:
        logger.error(f"Title generation failed: {e}")
        return {"title": "New Chat"}

@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    """Stream LLM response for a product question."""
    logger.info(f"=== /chat/stream called: url={req.url}, question={req.question[:50]}")

    # Get or fetch product data
    if req.url not in product_cache:
        try:
            data = await scrape_product(req.url)
            if not data or len(data) < 50:
                raise HTTPException(status_code=422, detail="Could not scrape product data.")
            product_cache[req.url] = data
        except Exception as e:
            logger.error(f"Chat scraping failed: {e}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")

    product_data = product_cache[req.url]

    async def generate():
        try:
            async for chunk in streaming_chain.astream({
                "product_data": product_data,
                "question": req.question,
            }):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        except Exception as e:
            logger.error(f"Streaming chain error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


@app.get("/health")
def health():
    return {"status": "ok", "model": "gemma4:31b-cloud"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)