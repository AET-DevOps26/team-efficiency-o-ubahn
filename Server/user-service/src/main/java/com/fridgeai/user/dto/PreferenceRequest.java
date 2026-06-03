package com.fridgeai.user.dto;

import java.util.List;

public class PreferenceRequest {
    private List<String> allergies;
    private String dietFocus;

    public List<String> getAllergies() { return allergies; }
    public void setAllergies(List<String> allergies) { this.allergies = allergies; }

    public String getDietFocus() { return dietFocus; }
    public void setDietFocus(String dietFocus) { this.dietFocus = dietFocus; }
}
