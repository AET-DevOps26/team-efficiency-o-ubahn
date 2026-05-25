package com.fridgeai.user.controller;

import com.fridgeai.user.dto.PreferenceRequest;
import com.fridgeai.user.model.Preference;
import com.fridgeai.user.service.PreferenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/preferences")
public class PreferenceController {

    private final PreferenceService preferenceService;

    public PreferenceController(PreferenceService preferenceService) {
        this.preferenceService = preferenceService;
    }

    @GetMapping("/me")
    public ResponseEntity<Preference> getMyPreferences(Principal principal) {
        return ResponseEntity.ok(preferenceService.getPreference(principal.getName()));
    }

    @PutMapping("/me")
    public ResponseEntity<Preference> updateMyPreferences(@RequestBody PreferenceRequest request, Principal principal) {
        return ResponseEntity.ok(preferenceService.updatePreference(principal.getName(), request));
    }

    @GetMapping("/internal/{email}")
    public ResponseEntity<Preference> getPreferencesByEmail(@PathVariable String email) {
        return ResponseEntity.ok(preferenceService.getPreference(email));
    }
}
