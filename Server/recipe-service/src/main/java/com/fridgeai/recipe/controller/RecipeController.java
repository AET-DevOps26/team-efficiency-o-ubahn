package com.fridgeai.recipe.controller;

import com.fridgeai.recipe.dto.RecipeRequest;
import com.fridgeai.recipe.model.Favourite;
import com.fridgeai.recipe.model.Recipe;
import com.fridgeai.recipe.service.RecipeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/recipes")
public class RecipeController {

    private final RecipeService recipeService;

    public RecipeController(RecipeService recipeService) { this.recipeService = recipeService; }

    @GetMapping
    public ResponseEntity<List<Recipe>> getAllRecipes() {
        return ResponseEntity.ok(recipeService.getAllRecipes());
    }

    @GetMapping("/favourites")
    public ResponseEntity<List<Favourite>> getFavourites(Principal principal) {
        return ResponseEntity.ok(recipeService.getFavourites(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Recipe> getRecipe(@PathVariable Long id) {
        return ResponseEntity.ok(recipeService.getRecipeById(id));
    }

    @PostMapping("/generate")
    public ResponseEntity<Recipe> generateRecipe(Principal principal) {
        return ResponseEntity.ok(recipeService.generateRecipe(principal.getName()));
    }

    @PostMapping
    public ResponseEntity<Recipe> createRecipe(@RequestBody RecipeRequest request) {
        return ResponseEntity.ok(recipeService.createRecipe(request));
    }

    @PostMapping("/{id}/favourite")
    public ResponseEntity<Favourite> addFavourite(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(recipeService.addFavourite(principal.getName(), id));
    }

    @DeleteMapping("/{id}/favourite")
    public ResponseEntity<Void> removeFavourite(@PathVariable Long id, Principal principal) {
        recipeService.removeFavourite(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
