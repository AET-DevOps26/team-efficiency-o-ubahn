package com.fridgeai.user.controller;

import com.fridgeai.user.dto.PreferenceRequest;
import com.fridgeai.user.model.Preference;
import com.fridgeai.user.service.PreferenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/preferences")
@Tag(name = "Preferences", description = "Dietary preferences and allergies")
public class PreferenceController {

    private final PreferenceService preferenceService;

    public PreferenceController(PreferenceService preferenceService) {
        this.preferenceService = preferenceService;
    }

    @Operation(summary = "Get my preferences", description = "Returns the authenticated user's dietary preferences.")
    @GetMapping("/me")
    public ResponseEntity<Preference> getMyPreferences(Principal principal) {
        return ResponseEntity.ok(preferenceService.getPreference(principal.getName()));
    }

    @Operation(summary = "Update my preferences", description = "Replaces the authenticated user's diet focus and allergies.")
    @PutMapping("/me")
    public ResponseEntity<Preference> updateMyPreferences(@RequestBody PreferenceRequest request, Principal principal) {
        return ResponseEntity.ok(preferenceService.updatePreference(principal.getName(), request));
    }

    @Operation(summary = "Get preferences by email (internal)",
            description = "Service-to-service lookup used by recipe-service. Not for public use.")
    @GetMapping("/internal/{email}")
    public ResponseEntity<Preference> getPreferencesByEmail(@PathVariable String email) {
        return ResponseEntity.ok(preferenceService.getPreference(email));
    }
}
