package com.example.fabritrack.config;

import com.example.fabritrack.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public
                .requestMatchers("/api/users/signup", "/api/users/login").permitAll()
                // Own profile – any authenticated user
                .requestMatchers("/api/users/me", "/api/users/me/**").authenticated()
                // User management – Admin only
                .requestMatchers(HttpMethod.GET, "/api/users").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/users").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/users/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/users/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasRole("ADMIN")
                // Asset categories & locations – Admin, IT
                .requestMatchers("/api/asset-categories", "/api/asset-categories/**").hasAnyRole("ADMIN", "IT")
                .requestMatchers("/api/locations", "/api/locations/**").hasAnyRole("ADMIN", "IT")
                // Assets – Admin & IT full; Finance read-only
                .requestMatchers(HttpMethod.GET, "/api/assets").hasAnyRole("ADMIN", "IT", "FINANCE")
                .requestMatchers(HttpMethod.GET, "/api/assets/**").hasAnyRole("ADMIN", "IT", "FINANCE")
                .requestMatchers(HttpMethod.POST, "/api/assets").hasAnyRole("ADMIN", "IT")
                .requestMatchers(HttpMethod.PUT, "/api/assets/**").hasAnyRole("ADMIN", "IT")
                .requestMatchers(HttpMethod.DELETE, "/api/assets/**").hasAnyRole("ADMIN", "IT")
                // Assignments, reservations, maintenance, attachments, comments – Admin, IT
                .requestMatchers("/api/asset-assignments", "/api/asset-assignments/**").hasAnyRole("ADMIN", "IT")
                .requestMatchers("/api/asset-reservations", "/api/asset-reservations/**").hasAnyRole("ADMIN", "IT")
                .requestMatchers("/api/maintenance-records", "/api/maintenance-records/**").hasAnyRole("ADMIN", "IT")
                .requestMatchers("/api/attachments", "/api/attachments/**").hasAnyRole("ADMIN", "IT")
                .requestMatchers("/api/comments", "/api/comments/**").hasAnyRole("ADMIN", "IT")
                // Asset movements – Admin & IT full; Security can view and create (track movement)
                .requestMatchers(HttpMethod.GET, "/api/asset-movements").hasAnyRole("ADMIN", "IT", "SECURITY")
                .requestMatchers(HttpMethod.GET, "/api/asset-movements/**").hasAnyRole("ADMIN", "IT", "SECURITY")
                .requestMatchers(HttpMethod.POST, "/api/asset-movements").hasAnyRole("ADMIN", "IT", "SECURITY")
                .requestMatchers(HttpMethod.POST, "/api/asset-movements/**").hasAnyRole("ADMIN", "IT", "SECURITY")
                .requestMatchers(HttpMethod.PUT, "/api/asset-movements/**").hasAnyRole("ADMIN", "IT")
                .requestMatchers(HttpMethod.DELETE, "/api/asset-movements/**").hasAnyRole("ADMIN", "IT")
                // Depreciation – Admin, Finance
                .requestMatchers("/api/depreciation-records", "/api/depreciation-records/**").hasAnyRole("ADMIN", "FINANCE")
                // Audit logs – Admin, Security
                .requestMatchers("/api/audit-logs", "/api/audit-logs/**").hasAnyRole("ADMIN", "SECURITY")
                // Notifications – all roles
                .requestMatchers("/api/notifications", "/api/notifications/**").hasAnyRole("ADMIN", "IT", "FINANCE", "SECURITY")
                // Any other API – Admin only
                .requestMatchers("/api/**").hasRole("ADMIN")
                .anyRequest().permitAll())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
