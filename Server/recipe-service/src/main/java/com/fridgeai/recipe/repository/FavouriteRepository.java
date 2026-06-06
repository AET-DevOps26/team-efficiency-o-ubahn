package com.fridgeai.recipe.repository;

import com.fridgeai.recipe.model.Favourite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavouriteRepository extends JpaRepository<Favourite, Long> {
    List<Favourite> findByUserEmail(String userEmail);
    Optional<Favourite> findByUserEmailAndRecipeId(String userEmail, Long recipeId);
}
