import json

from fastapi.testclient import TestClient
from openai import OpenAIError

from app import main
from app.schemas import GeneratedRecipe, RecipeIngredientOut

client = TestClient(main.app)

REQUEST_BODY = {
    "ingredients": [{"name": "chicken", "quantity": 2.0, "unit": "PIECE"}],
    "preferences": {"allergies": ["nuts"], "dietFocus": "protein"},
}


def test_health_reports_configured_provider_and_model():
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["provider"] == main.settings.provider
    assert body["model"] == main.settings.model


def test_generate_recipe_returns_generated_recipe(monkeypatch):
    fake_recipe = GeneratedRecipe(
        title="Garlic Chicken Rice",
        instructions="Cook it.",
        prepTimeMinutes=30,
        nutritionInfo="~450 kcal",
        ingredients=[RecipeIngredientOut(name="chicken", amount="200g")],
    )
    monkeypatch.setattr(main.generator, "generate", lambda req: fake_recipe)

    response = client.post("/api/genai/generate-recipe", json=REQUEST_BODY)

    assert response.status_code == 200
    assert response.json()["title"] == "Garlic Chicken Rice"


def test_generate_recipe_returns_502_on_malformed_model_output(monkeypatch):
    def raise_decode_error(req):
        raise json.JSONDecodeError("bad json", "doc", 0)

    monkeypatch.setattr(main.generator, "generate", raise_decode_error)

    response = client.post("/api/genai/generate-recipe", json=REQUEST_BODY)

    assert response.status_code == 502
    assert response.json()["detail"] == "Model returned malformed output"


def test_generate_recipe_returns_502_on_llm_provider_error(monkeypatch):
    def raise_openai_error(req):
        raise OpenAIError("upstream is down")

    monkeypatch.setattr(main.generator, "generate", raise_openai_error)

    response = client.post("/api/genai/generate-recipe", json=REQUEST_BODY)

    assert response.status_code == 502
    assert "upstream is down" in response.json()["detail"]
