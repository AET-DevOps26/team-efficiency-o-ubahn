package com.fridgeai.user.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "preference")
public class Preference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ElementCollection
    @CollectionTable(name = "preference_allergies", joinColumns = @JoinColumn(name = "preference_id"))
    @Column(name = "allergy")
    private List<String> allergies = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "preference_dietary", joinColumns = @JoinColumn(name = "preference_id"))
    @Column(name = "dietary_preference")
    private List<String> dietaryPreferences = new ArrayList<>();

    private String nutritionGoal;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public List<String> getAllergies() { return allergies; }
    public void setAllergies(List<String> allergies) { this.allergies = allergies; }

    public List<String> getDietaryPreferences() { return dietaryPreferences; }
    public void setDietaryPreferences(List<String> dietaryPreferences) { this.dietaryPreferences = dietaryPreferences; }

    public String getNutritionGoal() { return nutritionGoal; }
    public void setNutritionGoal(String nutritionGoal) { this.nutritionGoal = nutritionGoal; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
