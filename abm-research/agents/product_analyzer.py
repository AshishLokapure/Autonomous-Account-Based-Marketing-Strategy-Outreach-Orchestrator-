"""Product Analyzer Agent.

Builds a full ProductProfile including semantic keyword groups from the LLM.
If a product website is provided, extracts product information from it first.
"""
import logging
from pydantic import BaseModel, Field

from models.product import ProductInput, ProductProfile, ProductKeywords
from services.llm_service import call_structured
from collectors.website_collector import fetch_page_text

logger = logging.getLogger(__name__)


class _LLMProductAnalysis(BaseModel):
    use_cases: list[str] = Field(default_factory=list)
    customer_types: list[str] = Field(default_factory=list)
    buyer_personas: list[str] = Field(default_factory=list)
    relevant_industries: list[str] = Field(default_factory=list)
    business_problems_solved: list[str] = Field(default_factory=list)
    competitor_categories: list[str] = Field(default_factory=list)
    pain_keywords: list[str] = Field(default_factory=list)
    solution_keywords: list[str] = Field(default_factory=list)
    growth_keywords: list[str] = Field(default_factory=list)
    hiring_keywords: list[str] = Field(default_factory=list)
    technology_keywords: list[str] = Field(default_factory=list)
    intent_keywords: list[str] = Field(default_factory=list)


def analyze_product(product: ProductInput) -> ProductProfile:
    """Build a full ProductProfile with semantic keyword groups."""
    description = product.description
    if product.website:
        try:
            page_text = fetch_page_text(product.website)
            if page_text:
                description = f"{description}\n\nWebsite content:\n{page_text[:3000]}"
                logger.info("Enriched product description from website: %s", product.website)
        except Exception as e:
            logger.warning("Could not fetch product website %s: %s", product.website, e)

    prompt = f"""Analyze this product and return a JSON object.

Product name: {product.name}
Description: {description}
Features: {', '.join(product.features)}
Value proposition: {product.value_proposition}

Return JSON with these exact keys:
- use_cases: list of 3-6 specific use cases
- customer_types: list of 3-5 company types that buy this
- buyer_personas: list of 3-5 job titles who buy/use this
- relevant_industries: list of 4-8 relevant industries
- business_problems_solved: list of 4-8 specific business problems this solves
- competitor_categories: list of 3-5 competitor product categories
- pain_keywords: list of 8-12 keywords describing customer pain points (NOT product name)
- solution_keywords: list of 8-12 keywords describing the solution space
- growth_keywords: list of 6-10 keywords indicating company growth/expansion signals
- hiring_keywords: list of 6-10 job title/role keywords indicating relevant hiring
- technology_keywords: list of 6-10 competitor/adjacent technology names
- intent_keywords: list of 6-10 keywords indicating purchase intent

Generate semantic keywords — not just the product name. Think about what problems
companies have BEFORE they know about this product."""

    analysis = call_structured(prompt, _LLMProductAnalysis, max_tokens=1500)

    return ProductProfile(
        name=product.name,
        website=product.website,
        description=product.description,
        features=product.features,
        value_proposition=product.value_proposition,
        use_cases=analysis.use_cases,
        customer_types=analysis.customer_types,
        buyer_personas=analysis.buyer_personas,
        relevant_industries=analysis.relevant_industries,
        business_problems_solved=analysis.business_problems_solved,
        competitor_categories=analysis.competitor_categories,
        keywords=ProductKeywords(
            pain_keywords=analysis.pain_keywords,
            solution_keywords=analysis.solution_keywords,
            growth_keywords=analysis.growth_keywords,
            hiring_keywords=analysis.hiring_keywords,
            technology_keywords=analysis.technology_keywords,
            intent_keywords=analysis.intent_keywords,
        ),
    )
