import json
import logging

from openai import OpenAI

from .config import Settings
from .prompt import SYSTEM_PROMPT, build_user_prompt
from .schemas import GeneratedRecipe, GenerateRecipeRequest

logger = logging.getLogger(__name__)


class RecipeGenerator:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = OpenAI(
            base_url=settings.base_url,
            api_key=settings.api_key,
            timeout=settings.request_timeout,
        )

    def generate(self, req: GenerateRecipeRequest) -> GeneratedRecipe:
        completion = self.client.chat.completions.create(
            model=self.settings.model,
            temperature=self.settings.temperature,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": build_user_prompt(req)},
            ],
        )
        content = completion.choices[0].message.content or ""
        return _parse_recipe(content)


def _parse_recipe(content: str) -> GeneratedRecipe:
    text = content.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if "\n" in text:
            first, rest = text.split("\n", 1)
            if first.strip().lower() in {"json", ""}:
                text = rest
    text = text.strip()

    data = json.loads(text)
    return GeneratedRecipe.model_validate(data)
