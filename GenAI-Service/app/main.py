import json
import logging

from fastapi import FastAPI, HTTPException
from openai import OpenAIError

from .config import get_settings
from .llm import RecipeGenerator
from .schemas import GeneratedRecipe, GenerateRecipeRequest

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("genai-service")

settings = get_settings()
generator = RecipeGenerator(settings)

app = FastAPI(
    title="FridgeAI GenAI Service",
    description="Generates recipes from a user's available ingredients and preferences.",
    version="1.0.0",
    docs_url="/genai/docs",
    openapi_url="/genai/openapi.json",
    redoc_url="/genai/redoc",
)


@app.get("/health")
def health():
    return {"status": "ok", "provider": settings.provider, "model": settings.model}


@app.post("/api/genai/generate-recipe", response_model=GeneratedRecipe)
def generate_recipe(req: GenerateRecipeRequest) -> GeneratedRecipe:
    try:
        recipe = generator.generate(req)
        logger.info("Generated recipe '%s' via %s", recipe.title, settings.provider)
        return recipe
    except json.JSONDecodeError:
        logger.exception("Model returned non-JSON output")
        raise HTTPException(status_code=502, detail="Model returned malformed output")
    except OpenAIError as exc:
        logger.exception("LLM call failed")
        raise HTTPException(status_code=502, detail=f"LLM provider error: {exc}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=settings.port)
