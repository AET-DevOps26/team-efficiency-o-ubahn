package com.fridgeai.user.service;

import com.fridgeai.user.dto.PreferenceRequest;
import com.fridgeai.user.model.Preference;
import com.fridgeai.user.model.User;
import com.fridgeai.user.repository.PreferenceRepository;
import com.fridgeai.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PreferenceServiceTest {

    @Mock
    private PreferenceRepository preferenceRepository;

    @Mock
    private UserRepository userRepository;

    private PreferenceService preferenceService() {
        return new PreferenceService(preferenceRepository, userRepository);
    }

    @Test
    void getPreference_returnsExistingPreference_whenOneAlreadyExists() {
        PreferenceService service = preferenceService();
        Preference existing = new Preference();
        existing.setDietFocus("protein");
        when(preferenceRepository.findByUserEmail("user@example.com"))
                .thenReturn(Optional.of(existing));

        Preference result = service.getPreference("user@example.com");

        assertSame(existing, result);
        verifyNoInteractions(userRepository);
        verify(preferenceRepository, never()).save(any());
    }

    @Test
    void getPreference_createsDefaultPreference_whenNoneExistsForUser() {
        PreferenceService service = preferenceService();
        User user = new User();
        user.setEmail("user@example.com");

        when(preferenceRepository.findByUserEmail("user@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(preferenceRepository.save(any(Preference.class))).thenAnswer(inv -> inv.getArgument(0));

        Preference result = service.getPreference("user@example.com");

        assertSame(user, result.getUser());
        verify(preferenceRepository).save(any(Preference.class));
    }

    @Test
    void getPreference_throwsNotFound_whenUserDoesNotExist() {
        PreferenceService service = preferenceService();
        when(preferenceRepository.findByUserEmail("missing@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.getPreference("missing@example.com"));

        assertEquals(404, ex.getStatusCode().value());
        verify(preferenceRepository, never()).save(any());
    }

    @Test
    void updatePreference_overwritesAllergiesAndDietFocus_andPersists() {
        PreferenceService service = preferenceService();
        Preference existing = new Preference();
        existing.setAllergies(List.of("gluten"));
        existing.setDietFocus("carb");
        when(preferenceRepository.findByUserEmail("user@example.com"))
                .thenReturn(Optional.of(existing));
        when(preferenceRepository.save(any(Preference.class))).thenAnswer(inv -> inv.getArgument(0));

        PreferenceRequest request = new PreferenceRequest();
        request.setAllergies(List.of("nuts", "dairy"));
        request.setDietFocus("protein");

        Preference result = service.updatePreference("user@example.com", request);

        assertEquals(List.of("nuts", "dairy"), result.getAllergies());
        assertEquals("protein", result.getDietFocus());

        ArgumentCaptor<Preference> saved = ArgumentCaptor.forClass(Preference.class);
        verify(preferenceRepository).save(saved.capture());
        assertSame(existing, saved.getValue());
    }
}
