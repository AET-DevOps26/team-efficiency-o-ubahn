package com.fridgeai.inventory.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private static final String SECRET = "test-secret-key-that-is-long-enough-for-hmac-sha-256";

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", SECRET);
    }

    private String tokenSignedWith(SecretKey key, long expiresInMs) {
        return Jwts.builder()
                .subject("user@example.com")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiresInMs))
                .signWith(key)
                .compact();
    }

    @Test
    void extractEmail_returnsSubjectOfValidToken() {
        String token = tokenSignedWith(Keys.hmacShaKeyFor(SECRET.getBytes()), 60_000);

        assertEquals("user@example.com", jwtUtil.extractEmail(token));
    }

    @Test
    void isTokenValid_returnsTrueForValidToken() {
        String token = tokenSignedWith(Keys.hmacShaKeyFor(SECRET.getBytes()), 60_000);

        assertTrue(jwtUtil.isTokenValid(token));
    }

    @Test
    void isTokenValid_returnsFalseForGarbageToken() {
        assertFalse(jwtUtil.isTokenValid("not-a-jwt"));
    }

    @Test
    void isTokenValid_returnsFalseForTokenSignedWithDifferentSecret() {
        SecretKey otherKey = Keys.hmacShaKeyFor(
                "a-completely-different-secret-key-used-to-sign-this".getBytes());
        String token = tokenSignedWith(otherKey, 60_000);

        assertFalse(jwtUtil.isTokenValid(token));
    }

    @Test
    void isTokenValid_returnsFalseForExpiredToken() {
        String expiredToken = tokenSignedWith(Keys.hmacShaKeyFor(SECRET.getBytes()), -60_000);

        assertFalse(jwtUtil.isTokenValid(expiredToken));
    }

    @Test
    void extractEmail_throwsForInvalidToken() {
        assertThrows(Exception.class, () -> jwtUtil.extractEmail("not-a-jwt"));
    }
}
