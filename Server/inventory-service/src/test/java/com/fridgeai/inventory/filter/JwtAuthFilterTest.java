package com.fridgeai.inventory.filter;

import com.fridgeai.inventory.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain chain;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doesNotAuthenticate_whenNoAuthorizationHeaderPresent() throws Exception {
        when(request.getHeader("Authorization")).thenReturn(null);

        new JwtAuthFilter(jwtUtil).doFilterInternal(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain).doFilter(request, response);
        verifyNoInteractions(jwtUtil);
    }

    @Test
    void doesNotAuthenticate_whenHeaderIsNotBearerScheme() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Basic dXNlcjpwYXNz");

        new JwtAuthFilter(jwtUtil).doFilterInternal(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain).doFilter(request, response);
        verifyNoInteractions(jwtUtil);
    }

    @Test
    void doesNotAuthenticate_whenTokenIsInvalid() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Bearer bad-token");
        when(jwtUtil.isTokenValid("bad-token")).thenReturn(false);

        new JwtAuthFilter(jwtUtil).doFilterInternal(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(jwtUtil, never()).extractEmail(any());
        verify(chain).doFilter(request, response);
    }

    @Test
    void authenticatesWithEmailFromToken_whenTokenIsValid() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Bearer good-token");
        when(jwtUtil.isTokenValid("good-token")).thenReturn(true);
        when(jwtUtil.extractEmail("good-token")).thenReturn("user@example.com");

        new JwtAuthFilter(jwtUtil).doFilterInternal(request, response, chain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals("user@example.com", auth.getPrincipal());
        assertTrue(auth.getAuthorities().isEmpty());
        verify(chain).doFilter(request, response);
    }
}
