from datetime import date
from typing import List

from .schemas import GenerateRecipeRequest, IngredientIn

SYSTEM_PROMPT = (
    "You are FridgeAI, a helpful cooking assistant. You generate a single, "
    "realistic recipe using mainly the ingredients the user already has at "
    "home, so they waste less food. You may assume common pantry staples "
    "(salt, pepper, oil, water). "
    "You MUST respect the user's allergies and diet focus. "
    "Respond with ONLY a JSON object (no markdown, no commentary) matching "
    "exactly this schema:\n"
    "{\n"
    '  "title": string,\n'
    '  "instructions": string,            // numbered, step-by-step\n'
    '  "prepTimeMinutes": integer,\n'
    '  "nutritionInfo": string,           // short, e.g. "~450 kcal, 30g protein"\n'
    '  "ingredients": [ { "name": string, "amount": string } ]\n'
    "}"
)


def _format_ingredient(ing: IngredientIn) -> str:
    parts: List[str] = [ing.name]
    if ing.quantity is not None:
        qty = f"{ing.quantity:g}"
        parts.append(f"({qty}{(' ' + ing.unit) if ing.unit else ''})")
    elif ing.unit:
        parts.append(f"({ing.unit})")
    if ing.expiryDate:
        parts.append(f"[expires {ing.expiryDate}]")
    return " ".join(parts)


def build_user_prompt(req: GenerateRecipeRequest) -> str:
    if req.ingredients:
        ingredients_block = "\n".join(f"- {_format_ingredient(i)}" for i in req.ingredients)
    else:
        ingredients_block = "- (none provided — suggest a simple recipe from common staples)"

    allergies = req.preferences.allergies or []
    allergies_text = ", ".join(allergies) if allergies else "none"
    diet_focus = req.preferences.dietFocus or "no specific focus"

    return (
        f"Today is {date.today().isoformat()}.\n\n"
        f"Available ingredients:\n{ingredients_block}\n\n"
        f"Allergies to strictly avoid: {allergies_text}\n"
        f"Diet focus: {diet_focus}\n\n"
        "Prioritise ingredients that expire soonest. "
        "Generate one recipe now as a JSON object."
    )
