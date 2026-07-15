import json
from unittest.mock import MagicMock

import pytest

from app.config import Settings
from app.llm import RecipeGenerator, _parse_recipe
from app.schemas import GenerateRecipeRequest, IngredientIn, PreferencesIn

VALID_RECIPE_JSON = json.dumps(
    {
        "title": "Garlic Chicken Rice",
        "instructions": "1. Cook rice. 2. Sear chicken with garlic.",
        "prepTimeMinutes": 30,
        "nutritionInfo": "~450 kcal, 30g protein",
        "ingredients": [{"name": "chicken", "amount": "200g"}],
    }
)


def test_parse_recipe_from_plain_json():
    recipe = _parse_recipe(VALID_RECIPE_JSON)

    assert recipe.title == "Garlic Chicken Rice"
    assert recipe.prepTimeMinutes == 30
    assert recipe.ingredients[0].name == "chicken"


def test_parse_recipe_from_json_code_fence():
    fenced = f"```json\n{VALID_RECIPE_JSON}\n```"

    recipe = _parse_recipe(fenced)

    assert recipe.title == "Garlic Chicken Rice"


def test_parse_recipe_from_bare_code_fence():
    fenced = f"```\n{VALID_RECIPE_JSON}\n```"

    recipe = _parse_recipe(fenced)

    assert recipe.title == "Garlic Chicken Rice"


def test_parse_recipe_raises_on_malformed_json():
    with pytest.raises(json.JSONDecodeError):
        _parse_recipe("this is not json")


def _fake_completion(content: str):
    message = MagicMock()
    message.content = content
    choice = MagicMock()
    choice.message = message
    completion = MagicMock()
    completion.choices = [choice]
    return completion


def test_generate_calls_openai_with_expected_request_and_parses_result():
    settings = Settings(provider="cloud")
    generator = RecipeGenerator(settings)
    generator.client = MagicMock()
    generator.client.chat.completions.create.return_value = _fake_completion(VALID_RECIPE_JSON)

    req = GenerateRecipeRequest(
        ingredients=[IngredientIn(name="chicken", quantity=2.0, unit="PIECE")],
        preferences=PreferencesIn(allergies=["nuts"], dietFocus="protein"),
    )

    recipe = generator.generate(req)

    assert recipe.title == "Garlic Chicken Rice"

    call_kwargs = generator.client.chat.completions.create.call_args.kwargs
    assert call_kwargs["model"] == settings.model
    assert call_kwargs["temperature"] == settings.temperature
    assert call_kwargs["response_format"] == {"type": "json_object"}
    assert call_kwargs["messages"][0]["role"] == "system"
    assert call_kwargs["messages"][1]["role"] == "user"
    assert "chicken" in call_kwargs["messages"][1]["content"]


def test_generate_propagates_parse_errors_for_malformed_model_output():
    settings = Settings(provider="cloud")
    generator = RecipeGenerator(settings)
    generator.client = MagicMock()
    generator.client.chat.completions.create.return_value = _fake_completion("not json")

    req = GenerateRecipeRequest(ingredients=[], preferences=PreferencesIn())

    with pytest.raises(json.JSONDecodeError):
        generator.generate(req)
