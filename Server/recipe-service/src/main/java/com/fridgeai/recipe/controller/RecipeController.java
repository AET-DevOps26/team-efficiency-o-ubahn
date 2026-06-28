package com.fridgeai.recipe.controller;

import com.fridgeai.recipe.dto.RecipeRequest;
import com.fridgeai.recipe.model.Favourite;
import com.fridgeai.recipe.model.Recipe;
import com.fridgeai.recipe.service.RecipeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/recipes")
@Tag(name = "Recipes", description = "Recipes, AI generation and favourites")
public class RecipeController {

    private final RecipeService recipeService;

    public RecipeController(RecipeService recipeService) { this.recipeService = recipeService; }

    @Operation(summary = "List all recipes", description = "Returns every stored recipe.")
    @GetMapping
    public ResponseEntity<List<Recipe>> getAllRecipes() {
        return ResponseEntity.ok(recipeService.getAllRecipes());
    }

    @Operation(summary = "Get my favourites", description = "Lists the authenticated user's favourite recipes.")
    @GetMapping("/favourites")
    public ResponseEntity<List<Favourite>> getFavourites(Principal principal) {
        return ResponseEntity.ok(recipeService.getFavourites(principal.getName()));
    }

    @Operation(summary = "Get a recipe", description = "Returns the recipe with the given id.")
    @GetMapping("/{id}")
    public ResponseEntity<Recipe> getRecipe(@PathVariable Long id) {
        return ResponseEntity.ok(recipeService.getRecipeById(id));
    }

    @Operation(summary = "Generate a recipe with AI",
            description = "Gathers the user's ingredients and preferences and calls the GenAI service to generate a recipe.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Recipe generated"),
            @ApiResponse(responseCode = "502", description = "GenAI service unavailable")
    })
    @PostMapping("/generate")
    public ResponseEntity<Recipe> generateRecipe(Principal principal) {
        return ResponseEntity.ok(recipeService.generateRecipe(principal.getName()));
    }

    @Operation(summary = "Create a recipe", description = "Persists a recipe directly (seed/test use).")
    @PostMapping
    public ResponseEntity<Recipe> createRecipe(@RequestBody RecipeRequest request) {
        return ResponseEntity.ok(recipeService.createRecipe(request));
    }

    @Operation(summary = "Add a favourite", description = "Marks the recipe as a favourite for the authenticated user.")
    @PostMapping("/{id}/favourite")
    public ResponseEntity<Favourite> addFavourite(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(recipeService.addFavourite(principal.getName(), id));
    }

    @Operation(summary = "Remove a favourite", description = "Removes the recipe from the authenticated user's favourites.")
    @DeleteMapping("/{id}/favourite")
    public ResponseEntity<Void> removeFavourite(@PathVariable Long id, Principal principal) {
        recipeService.removeFavourite(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
