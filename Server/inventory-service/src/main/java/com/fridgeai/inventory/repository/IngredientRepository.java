package com.fridgeai.inventory.repository;

import com.fridgeai.inventory.model.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {
}
