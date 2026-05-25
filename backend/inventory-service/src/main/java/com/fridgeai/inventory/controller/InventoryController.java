package com.fridgeai.inventory.controller;

import com.fridgeai.inventory.dto.IngredientRequest;
import com.fridgeai.inventory.model.Ingredient;
import com.fridgeai.inventory.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public ResponseEntity<List<Ingredient>> getInventory(Principal principal) {
        return ResponseEntity.ok(inventoryService.getIngredients(principal.getName()));
    }

    @PostMapping("/items")
    public ResponseEntity<Ingredient> addItem(@RequestBody IngredientRequest request, Principal principal) {
        return ResponseEntity.ok(inventoryService.addIngredient(principal.getName(), request));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        inventoryService.deleteIngredient(id);
        return ResponseEntity.noContent().build();
    }
}
