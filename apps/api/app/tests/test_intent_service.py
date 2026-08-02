from app.services.agents.intent_service import IntentService


def test_intent_service_returns_explainable_scores() -> None:
    result = IntentService().run("Azure AI", campaign_id="cmp-001")

    assert result["agent"] == "Intent Agent"
    assert result["status"] == "completed"
    assert result["result"]["campaign_id"] == "cmp-001"
    assert result["result"]["companies"]

    company = result["result"]["companies"][0]
    assert 0 <= company["intent_score"] <= 100
    assert 0 <= company["purchase_probability"] <= 100
    assert company["positive_signals"]
    assert "line_items" in company["explanation"]
    assert company["recommended_priority"] in {"P1", "P2", "P3"}

