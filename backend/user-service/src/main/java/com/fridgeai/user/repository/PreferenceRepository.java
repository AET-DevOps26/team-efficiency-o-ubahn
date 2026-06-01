package com.fridgeai.user.repository;

import com.fridgeai.user.model.Preference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PreferenceRepository extends JpaRepository<Preference, Long> {
    Optional<Preference> findByUserEmail(String email);
}
