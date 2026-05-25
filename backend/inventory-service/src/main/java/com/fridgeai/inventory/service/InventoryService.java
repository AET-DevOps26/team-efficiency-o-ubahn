package com.fridgeai.inventory.service;

import com.fridgeai.inventory.dto.IngredientRequest;
import com.fridgeai.inventory.model.Ingredient;
import com.fridgeai.inventory.model.Inventory;
import com.fridgeai.inventory.repository.IngredientRepository;
import com.fridgeai.inventory.repository.InventoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final IngredientRepository ingredientRepository;

    public InventoryService(InventoryRepository inventoryRepository, IngredientRepository ingredientRepository) {
        this.inventoryRepository = inventoryRepository;
        this.ingredientRepository = ingredientRepository;
    }

    public List<Ingredient> getIngredients(String userEmail) {
        return findOrCreate(userEmail).getIngredients();
    }

    public Ingredient addIngredient(String userEmail, IngredientRequest request) {
        Inventory inventory = findOrCreate(userEmail);
        Ingredient ingredient = new Ingredient();
        ingredient.setName(request.getName());
        ingredient.setQuantity(request.getQuantity());
        ingredient.setUnit(request.getUnit());
        ingredient.setExpiryDate(request.getExpiryDate());
        ingredient.setInventory(inventory);
        return ingredientRepository.save(ingredient);
    }

    public void deleteIngredient(Long id) {
        ingredientRepository.deleteById(id);
    }

    private Inventory findOrCreate(String userEmail) {
        return inventoryRepository.findByUserEmail(userEmail)
                .orElseGet(() -> {
                    Inventory inv = new Inventory();
                    inv.setUserEmail(userEmail);
                    return inventoryRepository.save(inv);
                });
    }
}
