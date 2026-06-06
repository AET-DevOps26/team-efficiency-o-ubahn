package com.fridgeai.recipe.dto;

import java.util.List;

public class RecipeRequest {
    private String title;
    private String instructions;
    private Integer prepTimeMinutes;
    private String nutritionInfo;
    private List<RecipeIngredientRequest> ingredients;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public Integer getPrepTimeMinutes() { return prepTimeMinutes; }
    public void setPrepTimeMinutes(Integer prepTimeMinutes) { this.prepTimeMinutes = prepTimeMinutes; }

    public String getNutritionInfo() { return nutritionInfo; }
    public void setNutritionInfo(String nutritionInfo) { this.nutritionInfo = nutritionInfo; }

    public List<RecipeIngredientRequest> getIngredients() { return ingredients; }
    public void setIngredients(List<RecipeIngredientRequest> ingredients) { this.ingredients = ingredients; }
}
