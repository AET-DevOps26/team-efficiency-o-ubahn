package com.fridgeai.recipe.repository;

import com.fridgeai.recipe.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
}
