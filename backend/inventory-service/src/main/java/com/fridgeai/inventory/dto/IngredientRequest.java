package com.fridgeai.inventory.dto;

import com.fridgeai.inventory.model.Unit;
import java.time.LocalDate;

public class IngredientRequest {
    private String name;
    private Double quantity;
    private Unit unit;
    private LocalDate expiryDate;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }

    public Unit getUnit() { return unit; }
    public void setUnit(Unit unit) { this.unit = unit; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
}
