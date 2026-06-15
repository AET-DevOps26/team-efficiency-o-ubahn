from typing import List, Optional

from pydantic import BaseModel, Field


class IngredientIn(BaseModel):
    name: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    expiryDate: Optional[str] = None


class PreferencesIn(BaseModel):
    allergies: List[str] = Field(default_factory=list)
    dietFocus: Optional[str] = None


class GenerateRecipeRequest(BaseModel):
    ingredients: List[IngredientIn] = Field(default_factory=list)
    preferences: PreferencesIn = Field(default_factory=PreferencesIn)


class RecipeIngredientOut(BaseModel):
    name: str
    amount: str


class GeneratedRecipe(BaseModel):
    title: str
    instructions: str
    prepTimeMinutes: int
    nutritionInfo: str
    ingredients: List[RecipeIngredientOut] = Field(default_factory=list)
