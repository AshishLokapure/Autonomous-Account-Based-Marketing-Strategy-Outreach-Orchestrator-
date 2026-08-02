"""Research Agent — loads the pre-generated research report for a product."""

import time

from app.core.logger import logger
from app.services.agents import load_research_data, validate_product


class ResearchService:
    AGENT = "Research Agent"

    def run(self, product: str) -> dict:
        started = time.perf_counter()
        validate_product(product)
        logger.info(f"{self.AGENT} started — product={product}")

        data = load_research_data(product)
        companies = data["companies"]
        confidences = [c["research_scores"]["overall_confidence"] for c in companies]
        confidence = round(sum(confidences) / len(confidences))

        execution_time = round(time.perf_counter() - started, 3)
        logger.info(f"{self.AGENT} completed — {len(companies)} companies ({execution_time}s)")
        return {
            "agent": self.AGENT,
            "status": "completed",
            "execution_time": execution_time,
            "confidence": confidence,
            "result": {
                "product": data["product"],
                "organization": data["organization"],
                "campaign": data["campaign"],
                "companies_analyzed": len(companies),
                "companies": companies,
            },
        }
