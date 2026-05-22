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

    private String dietFocus;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public List<String> getAllergies() { return allergies; }
    public void setAllergies(List<String> allergies) { this.allergies = allergies; }

    public String getDietFocus() { return dietFocus; }
    public void setDietFocus(String dietFocus) { this.dietFocus = dietFocus; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
