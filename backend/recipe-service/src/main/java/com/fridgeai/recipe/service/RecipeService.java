package com.fridgeai.recipe.service;

import com.fridgeai.recipe.dto.IngredientDto;
import com.fridgeai.recipe.dto.PreferenceDto;
import com.fridgeai.recipe.dto.RecipeRequest;
import com.fridgeai.recipe.model.Favourite;
import com.fridgeai.recipe.model.Recipe;
import com.fridgeai.recipe.model.RecipeIngredient;
import com.fridgeai.recipe.repository.FavouriteRepository;
import com.fridgeai.recipe.repository.RecipeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final FavouriteRepository favouriteRepository;
    private final RestTemplate restTemplate;

    @Value("${inventory.service.url}")
    private String inventoryServiceUrl;

    @Value("${user.service.url}")
    private String userServiceUrl;

    public RecipeService(RecipeRepository recipeRepository, FavouriteRepository favouriteRepository, RestTemplate restTemplate) {
        this.recipeRepository = recipeRepository;
        this.favouriteRepository = favouriteRepository;
        this.restTemplate = restTemplate;
    }

    public List<Recipe> getAllRecipes() {
        return recipeRepository.findAll();
    }

    public Recipe getRecipeById(Long id) {
        return recipeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipe not found"));
    }

    public Recipe createRecipe(RecipeRequest request) {
        Recipe recipe = new Recipe();
        recipe.setTitle(request.getTitle());
        recipe.setInstructions(request.getInstructions());
        recipe.setPrepTimeMinutes(request.getPrepTimeMinutes());
        recipe.setNutritionInfo(request.getNutritionInfo());
        if (request.getIngredients() != null) {
            for (var ri : request.getIngredients()) {
                RecipeIngredient ingredient = new RecipeIngredient();
                ingredient.setName(ri.getName());
                ingredient.setAmount(ri.getAmount());
                ingredient.setRecipe(recipe);
                recipe.getIngredients().add(ingredient);
            }
        }
        return recipeRepository.save(recipe);
    }

    public List<Favourite> getFavourites(String userEmail) {
        return favouriteRepository.findByUserEmail(userEmail);
    }

    public Favourite addFavourite(String userEmail, Long recipeId) {
        Recipe recipe = getRecipeById(recipeId);
        favouriteRepository.findByUserEmailAndRecipeId(userEmail, recipeId)
                .ifPresent(f -> { throw new ResponseStatusException(HttpStatus.CONFLICT, "Already favourited"); });
        Favourite fav = new Favourite();
        fav.setUserEmail(userEmail);
        fav.setRecipe(recipe);
        return favouriteRepository.save(fav);
    }

    public Recipe generateRecipe(String userEmail) {
        List<IngredientDto> ingredients = restTemplate.exchange(
                inventoryServiceUrl + "/api/inventory/internal/" + userEmail,
                HttpMethod.GET, null,
                new ParameterizedTypeReference<List<IngredientDto>>() {}
        ).getBody();

        PreferenceDto preferences = restTemplate.getForObject(
                userServiceUrl + "/api/preferences/internal/" + userEmail,
                PreferenceDto.class
        );

        // TODO: call AI service with ingredients and preferences to generate recipe
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, "AI integration pending");
    }

    public void removeFavourite(String userEmail, Long recipeId) {
        Favourite fav = favouriteRepository.findByUserEmailAndRecipeId(userEmail, recipeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favourite not found"));
        favouriteRepository.delete(fav);
    }
}
