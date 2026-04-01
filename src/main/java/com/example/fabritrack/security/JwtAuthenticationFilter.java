package com.example.fabritrack.security;

import com.example.fabritrack.entity.User;
import com.example.fabritrack.repository.UserRepository;
import com.example.fabritrack.service.RolePermissionService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Validates JWT and sets authentication with authorities derived from the user's
 * role permissions (permission-based access control).
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RolePermissionService rolePermissionService;

    public JwtAuthenticationFilter(JwtService jwtService,
                                  UserRepository userRepository,
                                  RolePermissionService rolePermissionService) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.rolePermissionService = rolePermissionService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String authHeader = request.getHeader(AUTHORIZATION_HEADER);

        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(BEARER_PREFIX.length());

        if (!jwtService.isValidToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        Claims claims = jwtService.parseToken(token);
        String userIdStr = claims.getSubject();
        if (userIdStr == null || userIdStr.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        UUID userId;
        try {
            userId = UUID.fromString(userIdStr);
        } catch (IllegalArgumentException e) {
            filterChain.doFilter(request, response);
            return;
        }

        List<SimpleGrantedAuthority> authorities = userRepository.findById(userId)
                .map(User::getRole)
                .map(rolePermissionService::getPermissionNamesForRole)
                .map(perms -> perms.stream()
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList()))
                .orElse(List.of());

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userIdStr, null, authorities);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }
}
