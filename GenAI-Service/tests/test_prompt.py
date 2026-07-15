from datetime import date

from app.prompt import _format_ingredient, build_user_prompt
from app.schemas import GenerateRecipeRequest, IngredientIn, PreferencesIn


def test_format_ingredient_includes_quantity_and_unit():
    ing = IngredientIn(name="chicken", quantity=2.0, unit="PIECE")

    assert _format_ingredient(ing) == "chicken (2 PIECE)"


def test_format_ingredient_with_unit_but_no_quantity():
    ing = IngredientIn(name="salt", unit="pinch")

    assert _format_ingredient(ing) == "salt (pinch)"


def test_format_ingredient_with_neither_quantity_nor_unit():
    ing = IngredientIn(name="mystery leftovers")

    assert _format_ingredient(ing) == "mystery leftovers"


def test_format_ingredient_includes_expiry_date():
    ing = IngredientIn(name="garlic", quantity=3.0, unit="CLOVE", expiryDate="2026-07-20")

    assert _format_ingredient(ing) == "garlic (3 CLOVE) [expires 2026-07-20]"


def test_build_user_prompt_lists_all_ingredients():
    req = GenerateRecipeRequest(
        ingredients=[
            IngredientIn(name="chicken", quantity=2.0, unit="PIECE"),
            IngredientIn(name="rice", quantity=500.0, unit="GRAM"),
        ],
        preferences=PreferencesIn(),
    )

    prompt = build_user_prompt(req)

    assert "- chicken (2 PIECE)" in prompt
    assert "- rice (500 GRAM)" in prompt


def test_build_user_prompt_falls_back_when_no_ingredients():
    req = GenerateRecipeRequest(ingredients=[], preferences=PreferencesIn())

    prompt = build_user_prompt(req)

    assert "none provided" in prompt


def test_build_user_prompt_includes_allergies_and_diet_focus():
    req = GenerateRecipeRequest(
        ingredients=[IngredientIn(name="peanuts")],
        preferences=PreferencesIn(allergies=["nuts", "dairy"], dietFocus="protein"),
    )

    prompt = build_user_prompt(req)

    assert "Allergies to strictly avoid: nuts, dairy" in prompt
    assert "Diet focus: protein" in prompt


def test_build_user_prompt_defaults_when_no_preferences_set():
    req = GenerateRecipeRequest(
        ingredients=[IngredientIn(name="eggs")],
        preferences=PreferencesIn(),
    )

    prompt = build_user_prompt(req)

    assert "Allergies to strictly avoid: none" in prompt
    assert "Diet focus: no specific focus" in prompt


def test_build_user_prompt_includes_todays_date():
    req = GenerateRecipeRequest(ingredients=[], preferences=PreferencesIn())

    prompt = build_user_prompt(req)

    assert date.today().isoformat() in prompt
