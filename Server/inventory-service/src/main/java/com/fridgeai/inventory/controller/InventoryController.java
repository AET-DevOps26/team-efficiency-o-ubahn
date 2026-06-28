package com.fridgeai.inventory.controller;

import com.fridgeai.inventory.dto.IngredientRequest;
import com.fridgeai.inventory.model.Ingredient;
import com.fridgeai.inventory.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@Tag(name = "Inventory", description = "Fridge ingredients for the authenticated user")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @Operation(summary = "Get my inventory", description = "Lists all ingredients for the authenticated user.")
    @GetMapping({"", "/"})
    public ResponseEntity<List<Ingredient>> getInventory(Principal principal) {
        return ResponseEntity.ok(inventoryService.getIngredients(principal.getName()));
    }

    @Operation(summary = "Add an ingredient", description = "Adds an ingredient to the authenticated user's fridge.")
    @PostMapping("/items")
    public ResponseEntity<Ingredient> addItem(@RequestBody IngredientRequest request, Principal principal) {
        return ResponseEntity.ok(inventoryService.addIngredient(principal.getName(), request));
    }

    @Operation(summary = "Get ingredients by email (internal)",
            description = "Service-to-service lookup used by recipe-service. Not for public use.")
    @GetMapping("/internal/{userEmail}")
    public ResponseEntity<List<Ingredient>> getIngredientsByEmail(@PathVariable String userEmail) {
        return ResponseEntity.ok(inventoryService.getIngredients(userEmail));
    }

    @Operation(summary = "Update an ingredient", description = "Updates the ingredient with the given id.")
    @PutMapping("/items/{id}")
    public ResponseEntity<Ingredient> updateItem(@PathVariable Long id, @RequestBody IngredientRequest request) {
        return ResponseEntity.ok(inventoryService.updateIngredient(id, request));
    }

    @Operation(summary = "Delete an ingredient", description = "Removes the ingredient with the given id.")
    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        inventoryService.deleteIngredient(id);
        return ResponseEntity.noContent().build();
    }
}
