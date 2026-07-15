package com.fridgeai.recipe.service;

import com.fridgeai.recipe.dto.IngredientDto;
import com.fridgeai.recipe.dto.PreferenceDto;
import com.fridgeai.recipe.dto.RecipeIngredientRequest;
import com.fridgeai.recipe.dto.RecipeRequest;
import com.fridgeai.recipe.model.Favourite;
import com.fridgeai.recipe.model.Recipe;
import com.fridgeai.recipe.repository.FavouriteRepository;
import com.fridgeai.recipe.repository.RecipeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecipeServiceTest {

    private static final String INVENTORY_URL = "http://inventory-service";
    private static final String USER_URL = "http://user-service";
    private static final String GENAI_URL = "http://genai-service";

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private FavouriteRepository favouriteRepository;

    @Mock
    private RestTemplate restTemplate;

    private RecipeService recipeService;

    @BeforeEach
    void setUp() {
        recipeService = new RecipeService(recipeRepository, favouriteRepository, restTemplate);
        ReflectionTestUtils.setField(recipeService, "inventoryServiceUrl", INVENTORY_URL);
        ReflectionTestUtils.setField(recipeService, "userServiceUrl", USER_URL);
        ReflectionTestUtils.setField(recipeService, "genaiServiceUrl", GENAI_URL);
    }

    @Test
    void getRecipeById_returnsRecipe_whenFound() {
        Recipe recipe = new Recipe();
        recipe.setId(1L);
        when(recipeRepository.findById(1L)).thenReturn(Optional.of(recipe));

        assertSame(recipe, recipeService.getRecipeById(1L));
    }

    @Test
    void getRecipeById_throwsNotFound_whenMissing() {
        when(recipeRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> recipeService.getRecipeById(99L));
        assertEquals(404, ex.getStatusCode().value());
    }

    @Test
    void createRecipe_mapsIngredientsAndSaves() {
        RecipeRequest request = new RecipeRequest();
        request.setTitle("Garlic Chicken Rice");
        request.setInstructions("Cook it.");
        request.setPrepTimeMinutes(30);
        request.setNutritionInfo("400 kcal");
        RecipeIngredientRequest ingredient = new RecipeIngredientRequest();
        ingredient.setName("chicken");
        ingredient.setAmount("200g");
        request.setIngredients(List.of(ingredient));

        when(recipeRepository.save(any(Recipe.class))).thenAnswer(inv -> inv.getArgument(0));

        Recipe result = recipeService.createRecipe(request);

        assertEquals("Garlic Chicken Rice", result.getTitle());
        assertEquals(1, result.getIngredients().size());
        assertEquals("chicken", result.getIngredients().get(0).getName());
        assertEquals("200g", result.getIngredients().get(0).getAmount());
        assertSame(result, result.getIngredients().get(0).getRecipe());
    }

    @Test
    void addFavourite_savesFavourite_whenNotAlreadyFavourited() {
        Recipe recipe = new Recipe();
        recipe.setId(5L);
        when(recipeRepository.findById(5L)).thenReturn(Optional.of(recipe));
        when(favouriteRepository.findByUserEmailAndRecipeId("user@example.com", 5L))
                .thenReturn(Optional.empty());
        when(favouriteRepository.save(any(Favourite.class))).thenAnswer(inv -> inv.getArgument(0));

        Favourite result = recipeService.addFavourite("user@example.com", 5L);

        assertEquals("user@example.com", result.getUserEmail());
        assertSame(recipe, result.getRecipe());
    }

    @Test
    void addFavourite_throwsConflict_whenAlreadyFavourited() {
        Recipe recipe = new Recipe();
        recipe.setId(5L);
        when(recipeRepository.findById(5L)).thenReturn(Optional.of(recipe));
        when(favouriteRepository.findByUserEmailAndRecipeId("user@example.com", 5L))
                .thenReturn(Optional.of(new Favourite()));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> recipeService.addFavourite("user@example.com", 5L));
        assertEquals(409, ex.getStatusCode().value());
        verify(favouriteRepository, never()).save(any());
    }

    @Test
    void removeFavourite_deletesFavourite_whenFound() {
        Favourite fav = new Favourite();
        when(favouriteRepository.findByUserEmailAndRecipeId("user@example.com", 5L))
                .thenReturn(Optional.of(fav));

        recipeService.removeFavourite("user@example.com", 5L);

        verify(favouriteRepository).delete(fav);
    }

    @Test
    void removeFavourite_throwsNotFound_whenMissing() {
        when(favouriteRepository.findByUserEmailAndRecipeId("user@example.com", 5L))
                .thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> recipeService.removeFavourite("user@example.com", 5L));
        assertEquals(404, ex.getStatusCode().value());
        verify(favouriteRepository, never()).delete(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void generateRecipe_orchestratesInventoryPreferencesAndGenAi_thenSavesResult() {
        IngredientDto ingredient = new IngredientDto();
        ingredient.setName("chicken");
        ingredient.setQuantity(2.0);
        ingredient.setUnit("PIECE");
        when(restTemplate.exchange(
                eq(INVENTORY_URL + "/api/inventory/internal/user@example.com"),
                eq(HttpMethod.GET),
                isNull(),
                any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(List.of(ingredient), HttpStatus.OK));

        PreferenceDto preferences = new PreferenceDto();
        preferences.setDietFocus("protein");
        when(restTemplate.getForObject(
                USER_URL + "/api/preferences/internal/user@example.com", PreferenceDto.class
        )).thenReturn(preferences);

        RecipeRequest generated = new RecipeRequest();
        generated.setTitle("Garlic Chicken Rice");
        generated.setInstructions("Cook it.");
        when(restTemplate.postForObject(
                eq(GENAI_URL + "/api/genai/generate-recipe"), any(), eq(RecipeRequest.class)
        )).thenReturn(generated);

        when(recipeRepository.save(any(Recipe.class))).thenAnswer(inv -> inv.getArgument(0));

        Recipe result = recipeService.generateRecipe("user@example.com");

        assertEquals("Garlic Chicken Rice", result.getTitle());
        verify(recipeRepository).save(any(Recipe.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void generateRecipe_throwsBadGateway_whenGenAiCallFails() {
        when(restTemplate.exchange(
                anyString(), eq(HttpMethod.GET), isNull(), any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(List.of(), HttpStatus.OK));
        when(restTemplate.getForObject(anyString(), eq(PreferenceDto.class)))
                .thenReturn(new PreferenceDto());
        when(restTemplate.postForObject(anyString(), any(), eq(RecipeRequest.class)))
                .thenThrow(new RestClientException("GenAI service unavailable"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> recipeService.generateRecipe("user@example.com"));

        assertEquals(502, ex.getStatusCode().value());
        verify(recipeRepository, never()).save(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void generateRecipe_throwsBadGateway_whenGenAiReturnsNoUsableResult() {
        when(restTemplate.exchange(
                anyString(), eq(HttpMethod.GET), isNull(), any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(List.of(), HttpStatus.OK));
        when(restTemplate.getForObject(anyString(), eq(PreferenceDto.class)))
                .thenReturn(new PreferenceDto());
        when(restTemplate.postForObject(anyString(), any(), eq(RecipeRequest.class)))
                .thenReturn(new RecipeRequest());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> recipeService.generateRecipe("user@example.com"));

        assertEquals(502, ex.getStatusCode().value());
        verify(recipeRepository, never()).save(any());
    }
}
