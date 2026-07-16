package com.fridgeai.inventory.service;

import com.fridgeai.inventory.dto.IngredientRequest;
import com.fridgeai.inventory.model.Ingredient;
import com.fridgeai.inventory.model.Inventory;
import com.fridgeai.inventory.model.Unit;
import com.fridgeai.inventory.repository.IngredientRepository;
import com.fridgeai.inventory.repository.InventoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private IngredientRepository ingredientRepository;

    private InventoryService inventoryService() {
        return new InventoryService(inventoryRepository, ingredientRepository);
    }

    @Test
    void getIngredients_returnsIngredientsFromExistingInventory() {
        InventoryService service = inventoryService();
        Inventory inventory = new Inventory();
        Ingredient chicken = new Ingredient();
        chicken.setName("chicken");
        inventory.setIngredients(List.of(chicken));
        when(inventoryRepository.findByUserEmail("user@example.com")).thenReturn(Optional.of(inventory));

        List<Ingredient> result = service.getIngredients("user@example.com");

        assertEquals(1, result.size());
        assertEquals("chicken", result.get(0).getName());
        verify(inventoryRepository, never()).save(any());
    }

    @Test
    void getIngredients_createsEmptyInventory_whenUserHasNoneYet() {
        InventoryService service = inventoryService();
        when(inventoryRepository.findByUserEmail("new@example.com")).thenReturn(Optional.empty());
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(inv -> inv.getArgument(0));

        List<Ingredient> result = service.getIngredients("new@example.com");

        assertTrue(result.isEmpty());
        ArgumentCaptor<Inventory> saved = ArgumentCaptor.forClass(Inventory.class);
        verify(inventoryRepository).save(saved.capture());
        assertEquals("new@example.com", saved.getValue().getUserEmail());
    }

    @Test
    void addIngredient_attachesIngredientToExistingInventoryAndSaves() {
        InventoryService service = inventoryService();
        Inventory inventory = new Inventory();
        when(inventoryRepository.findByUserEmail("user@example.com")).thenReturn(Optional.of(inventory));
        when(ingredientRepository.save(any(Ingredient.class))).thenAnswer(inv -> inv.getArgument(0));

        IngredientRequest request = new IngredientRequest();
        request.setName("garlic");
        request.setQuantity(3.0);
        request.setUnit(Unit.CLOVE);
        request.setExpiryDate(LocalDate.of(2026, 8, 1));

        Ingredient result = service.addIngredient("user@example.com", request);

        assertEquals("garlic", result.getName());
        assertEquals(3.0, result.getQuantity());
        assertEquals(Unit.CLOVE, result.getUnit());
        assertEquals(LocalDate.of(2026, 8, 1), result.getExpiryDate());
        assertSame(inventory, result.getInventory());
        verify(inventoryRepository, never()).save(any());
    }

    @Test
    void addIngredient_createsInventoryFirst_whenUserHasNoneYet() {
        InventoryService service = inventoryService();
        when(inventoryRepository.findByUserEmail("new@example.com")).thenReturn(Optional.empty());
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(inv -> inv.getArgument(0));
        when(ingredientRepository.save(any(Ingredient.class))).thenAnswer(inv -> inv.getArgument(0));

        IngredientRequest request = new IngredientRequest();
        request.setName("rice");
        request.setQuantity(500.0);
        request.setUnit(Unit.GRAM);

        Ingredient result = service.addIngredient("new@example.com", request);

        assertEquals("new@example.com", result.getInventory().getUserEmail());
        verify(inventoryRepository).save(any(Inventory.class));
    }

    @Test
    void updateIngredient_overwritesFieldsAndPersists() {
        InventoryService service = inventoryService();
        Ingredient existing = new Ingredient();
        existing.setId(7L);
        existing.setName("old-name");
        when(ingredientRepository.findById(7L)).thenReturn(Optional.of(existing));
        when(ingredientRepository.save(any(Ingredient.class))).thenAnswer(inv -> inv.getArgument(0));

        IngredientRequest request = new IngredientRequest();
        request.setName("cheese");
        request.setQuantity(200.0);
        request.setUnit(Unit.GRAM);
        request.setExpiryDate(LocalDate.of(2026, 7, 20));

        Ingredient result = service.updateIngredient(7L, request);

        assertEquals("cheese", result.getName());
        assertEquals(200.0, result.getQuantity());
        assertEquals(Unit.GRAM, result.getUnit());
        assertEquals(LocalDate.of(2026, 7, 20), result.getExpiryDate());
        assertSame(existing, result);
    }

    @Test
    void updateIngredient_throwsNotFound_whenIngredientDoesNotExist() {
        InventoryService service = inventoryService();
        when(ingredientRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.updateIngredient(99L, new IngredientRequest()));

        assertEquals(404, ex.getStatusCode().value());
        verify(ingredientRepository, never()).save(any());
    }

    @Test
    void deleteIngredient_delegatesToRepository() {
        InventoryService service = inventoryService();

        service.deleteIngredient(3L);

        verify(ingredientRepository).deleteById(3L);
    }
}
