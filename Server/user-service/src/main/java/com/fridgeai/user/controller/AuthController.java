package com.fridgeai.user.controller;

import com.fridgeai.user.dto.AuthResponse;
import com.fridgeai.user.dto.LoginRequest;
import com.fridgeai.user.dto.RegisterRequest;
import com.fridgeai.user.model.Preference;
import com.fridgeai.user.model.User;
import com.fridgeai.user.repository.UserRepository;
import com.fridgeai.user.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Register and log in to obtain a JWT")
@SecurityRequirements
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, JwtUtil jwtUtil, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @Operation(summary = "Register a new account", description = "Creates a user with default preferences and returns a JWT.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Registered; JWT returned"),
            @ApiResponse(responseCode = "409", description = "Email already registered")
    })
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.status(409).body("Email already registered");
        }
        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        Preference preference = new Preference();
        preference.setAllergies(request.allergies());
        preference.setDietFocus(request.preference());
        preference.setUser(user);
        user.setPreference(preference);
        userRepository.save(user);
        return ResponseEntity.ok(new AuthResponse(jwtUtil.generateToken(request.email())));
    }

    @Operation(summary = "Log in", description = "Validates credentials and returns a JWT.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Authenticated; JWT returned"),
            @ApiResponse(responseCode = "401", description = "Invalid email or password")
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.email()).orElse(null);
        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }
        return ResponseEntity.ok(new AuthResponse(jwtUtil.generateToken(user.getEmail())));
    }
}
