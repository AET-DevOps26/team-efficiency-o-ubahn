package com.fridgeai.recipe.dto;

import java.util.List;

public class GenAiGenerateRequest {
    private List<GenAiIngredient> ingredients;
    private PreferenceDto preferences;

    public List<GenAiIngredient> getIngredients() { return ingredients; }
    public void setIngredients(List<GenAiIngredient> ingredients) { this.ingredients = ingredients; }

    public PreferenceDto getPreferences() { return preferences; }
    public void setPreferences(PreferenceDto preferences) { this.preferences = preferences; }
}
