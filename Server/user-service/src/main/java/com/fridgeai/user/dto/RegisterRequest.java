package com.fridgeai.user.dto;

import java.util.List;

public record RegisterRequest(String email, String password, List<String> allergies, String preference) {}
