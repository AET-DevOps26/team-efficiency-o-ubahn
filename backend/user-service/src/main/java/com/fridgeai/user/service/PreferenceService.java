package com.fridgeai.user.service;

import com.fridgeai.user.dto.PreferenceRequest;
import com.fridgeai.user.model.Preference;
import com.fridgeai.user.model.User;
import com.fridgeai.user.repository.PreferenceRepository;
import com.fridgeai.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PreferenceService {

    private final PreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    public PreferenceService(PreferenceRepository preferenceRepository, UserRepository userRepository) {
        this.preferenceRepository = preferenceRepository;
        this.userRepository = userRepository;
    }

    public Preference getPreference(String email) {
        return preferenceRepository.findByUserEmail(email)
                .orElseGet(() -> {
                    User user = userRepository.findByEmail(email)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
                    Preference preference = new Preference();
                    preference.setUser(user);
                    return preferenceRepository.save(preference);
                });
    }

    public Preference updatePreference(String email, PreferenceRequest request) {
        Preference preference = getPreference(email);
        preference.setAllergies(request.getAllergies());
        preference.setDietFocus(request.getDietFocus());
        return preferenceRepository.save(preference);
    }
}
