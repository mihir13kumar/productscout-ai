from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()

# Initialize Groq LLM
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.3,
    api_key=os.getenv("GROQ_API_KEY"),
)

# ---------------------------------------------------------
# Main Chat Chain
# ---------------------------------------------------------

# System prompt for product analysis
SYSTEM_PROMPT = """You are ProductScout AI, a helpful e-commerce shopping assistant.
You analyze raw text extracted from a product page and answer the user's specific questions.

CRITICAL INSTRUCTIONS:
1. ONLY answer the specific question asked. DO NOT dump or summarize the entire product data unless explicitly asked.
2. If the user asks for the price, just give the price.
3. If the user asks for the name, just give the name.
4. Keep your answers extremely concise and direct.
5. If the answer is not in the provided product data, politely say "I cannot find that information on the page."
6. Format your response using markdown.
7. DO NOT repeat the user's question or the product data tags.

PRODUCT DATA TO ANALYZE:
{product_data}
"""

# Prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "{question}")
])

# Build the chain using LangChain Runnables
def build_chain():
    chain = (
        RunnablePassthrough()
        | prompt
        | llm
        | StrOutputParser()
    )
    return chain

def build_streaming_chain():
    chain = (
        RunnablePassthrough()
        | prompt
        | llm
        | StrOutputParser()
    )
    return chain

product_chain = build_chain()
streaming_chain = build_streaming_chain()

# ---------------------------------------------------------
# Title Generation Chain
# ---------------------------------------------------------

TITLE_SYSTEM_PROMPT = """You are a title generator.
Based on the provided product data and user query, generate a VERY CONCISE title (2 to 4 words max) for the chat conversation.
DO NOT use quotes. DO NOT add punctuation. JUST the 2-4 words.
Example: 'Apple Watch Series 7' or 'Headphone Price Check'"""

title_prompt = ChatPromptTemplate.from_messages([
    ("system", TITLE_SYSTEM_PROMPT),
    ("human", "Query: {question}\nData Preview: {product_data}")
])

title_chain = (
    RunnablePassthrough()
    | title_prompt
    | llm
    | StrOutputParser()
)