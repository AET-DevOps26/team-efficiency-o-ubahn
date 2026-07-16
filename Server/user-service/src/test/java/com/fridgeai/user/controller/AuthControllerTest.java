package com.fridgeai.user.controller;

import com.fridgeai.user.dto.AuthResponse;
import com.fridgeai.user.dto.LoginRequest;
import com.fridgeai.user.dto.RegisterRequest;
import com.fridgeai.user.model.User;
import com.fridgeai.user.repository.UserRepository;
import com.fridgeai.user.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    private AuthController controller() {
        return new AuthController(userRepository, jwtUtil, passwordEncoder);
    }

    @Test
    void register_createsUserAndReturnsToken_whenEmailNotTaken() {
        AuthController authController = controller();
        RegisterRequest request = new RegisterRequest(
                "new@example.com", "plain-password", List.of("nuts"), "protein");

        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("plain-password")).thenReturn("hashed-password");
        when(jwtUtil.generateToken("new@example.com")).thenReturn("jwt-token");

        ResponseEntity<?> response = authController.register(request);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(new AuthResponse("jwt-token"), response.getBody());

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUser.capture());
        assertEquals("new@example.com", savedUser.getValue().getEmail());
        assertEquals("hashed-password", savedUser.getValue().getPasswordHash());
        assertEquals(List.of("nuts"), savedUser.getValue().getPreference().getAllergies());
        assertEquals("protein", savedUser.getValue().getPreference().getDietFocus());
        assertSame(savedUser.getValue(), savedUser.getValue().getPreference().getUser());
    }

    @Test
    void register_returnsConflict_whenEmailAlreadyRegistered() {
        AuthController authController = controller();
        RegisterRequest request = new RegisterRequest(
                "taken@example.com", "plain-password", List.of(), null);

        when(userRepository.findByEmail("taken@example.com"))
                .thenReturn(Optional.of(new User()));

        ResponseEntity<?> response = authController.register(request);

        assertEquals(409, response.getStatusCode().value());
        assertEquals("Email already registered", response.getBody());
        verify(userRepository, never()).save(any());
        verifyNoInteractions(jwtUtil);
    }

    @Test
    void login_returnsToken_whenCredentialsAreValid() {
        AuthController authController = controller();
        User user = new User();
        user.setEmail("user@example.com");
        user.setPasswordHash("hashed-password");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("plain-password", "hashed-password")).thenReturn(true);
        when(jwtUtil.generateToken("user@example.com")).thenReturn("jwt-token");

        ResponseEntity<?> response = authController.login(
                new LoginRequest("user@example.com", "plain-password"));

        assertEquals(200, response.getStatusCode().value());
        assertEquals(new AuthResponse("jwt-token"), response.getBody());
    }

    @Test
    void login_returnsUnauthorized_whenPasswordDoesNotMatch() {
        AuthController authController = controller();
        User user = new User();
        user.setEmail("user@example.com");
        user.setPasswordHash("hashed-password");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "hashed-password")).thenReturn(false);

        ResponseEntity<?> response = authController.login(
                new LoginRequest("user@example.com", "wrong-password"));

        assertEquals(401, response.getStatusCode().value());
        assertEquals("Invalid email or password", response.getBody());
        verifyNoInteractions(jwtUtil);
    }

    @Test
    void login_returnsUnauthorized_whenUserDoesNotExist() {
        AuthController authController = controller();
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        ResponseEntity<?> response = authController.login(
                new LoginRequest("missing@example.com", "any-password"));

        assertEquals(401, response.getStatusCode().value());
        assertEquals("Invalid email or password", response.getBody());
        verifyNoInteractions(jwtUtil);
        verify(passwordEncoder, never()).matches(any(), any());
    }
}
