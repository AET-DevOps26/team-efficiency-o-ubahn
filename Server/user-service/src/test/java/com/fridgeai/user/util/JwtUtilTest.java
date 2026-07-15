package com.fridgeai.user.util;

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

    @Test
    void generateToken_thenExtractEmail_roundTripsTheSubject() {
        String token = jwtUtil.generateToken("user@example.com");

        assertEquals("user@example.com", jwtUtil.extractEmail(token));
    }

    @Test
    void isTokenValid_returnsTrueForFreshlyGeneratedToken() {
        String token = jwtUtil.generateToken("user@example.com");

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
        String token = Jwts.builder()
                .subject("user@example.com")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(otherKey)
                .compact();

        assertFalse(jwtUtil.isTokenValid(token));
    }

    @Test
    void isTokenValid_returnsFalseForExpiredToken() {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());
        String expiredToken = Jwts.builder()
                .subject("user@example.com")
                .issuedAt(new Date(System.currentTimeMillis() - 120_000))
                .expiration(new Date(System.currentTimeMillis() - 60_000))
                .signWith(key)
                .compact();

        assertFalse(jwtUtil.isTokenValid(expiredToken));
    }

    @Test
    void extractEmail_throwsForInvalidToken() {
        assertThrows(Exception.class, () -> jwtUtil.extractEmail("not-a-jwt"));
    }
}
