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
                // User management
                .requestMatchers(HttpMethod.GET, "/api/users").hasAuthority("USER_MANAGE")
                .requestMatchers(HttpMethod.POST, "/api/users").hasAuthority("USER_MANAGE")
                .requestMatchers(HttpMethod.GET, "/api/users/**").hasAuthority("USER_MANAGE")
                .requestMatchers(HttpMethod.POST, "/api/users/**").hasAuthority("USER_MANAGE")
                .requestMatchers(HttpMethod.PUT, "/api/users/**").hasAuthority("USER_MANAGE")
                .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasAuthority("USER_MANAGE")
                // Asset categories & locations
                .requestMatchers("/api/asset-categories", "/api/asset-categories/**").hasAuthority("ASSET_CATEGORY_MANAGE")
                .requestMatchers("/api/locations", "/api/locations/**").hasAuthority("LOCATION_MANAGE")
                // Assets
                .requestMatchers(HttpMethod.GET, "/api/assets").hasAuthority("ASSET_READ")
                .requestMatchers(HttpMethod.GET, "/api/assets/**").hasAuthority("ASSET_READ")
                .requestMatchers(HttpMethod.POST, "/api/assets").hasAuthority("ASSET_WRITE")
                .requestMatchers(HttpMethod.PUT, "/api/assets/**").hasAuthority("ASSET_WRITE")
                .requestMatchers(HttpMethod.DELETE, "/api/assets/**").hasAuthority("ASSET_WRITE")
                // Assignments, employees, reservations, maintenance, attachments, location installation feedback
                .requestMatchers("/api/asset-assignments", "/api/asset-assignments/**").hasAuthority("ASSIGNMENT_MANAGE")
                .requestMatchers("/api/employees", "/api/employees/**").hasAuthority("EMPLOYEE_MANAGE")
                .requestMatchers("/api/asset-reservations", "/api/asset-reservations/**").hasAuthority("RESERVATION_MANAGE")
                .requestMatchers("/api/field-work-asset-requests", "/api/field-work-asset-requests/**").authenticated()
                .requestMatchers("/api/maintenance-records", "/api/maintenance-records/**").hasAuthority("MAINTENANCE_MANAGE")
                .requestMatchers("/api/attachments", "/api/attachments/**").hasAuthority("ATTACHMENT_MANAGE")
                .requestMatchers("/api/location-installation-feedback", "/api/location-installation-feedback/**").hasAuthority("COMMENT_MANAGE")
                // Technician tasks (field / installation work)
                .requestMatchers(HttpMethod.GET, "/api/technician-tasks", "/api/technician-tasks/**").hasAuthority("FIELD_TASK_READ")
                .requestMatchers(HttpMethod.PATCH, "/api/technician-tasks/**").hasAuthority("FIELD_TASK_READ")
                .requestMatchers(HttpMethod.POST, "/api/technician-tasks").hasAuthority("FIELD_TASK_MANAGE")
                .requestMatchers(HttpMethod.PUT, "/api/technician-tasks/**").hasAuthority("FIELD_TASK_MANAGE")
                .requestMatchers(HttpMethod.DELETE, "/api/technician-tasks/**").hasAuthority("FIELD_TASK_MANAGE")
                // Asset movements
                .requestMatchers(HttpMethod.GET, "/api/asset-movements").hasAuthority("MOVEMENT_READ")
                .requestMatchers(HttpMethod.GET, "/api/asset-movements/**").hasAuthority("MOVEMENT_READ")
                .requestMatchers(HttpMethod.POST, "/api/asset-movements").hasAuthority("MOVEMENT_WRITE")
                .requestMatchers(HttpMethod.POST, "/api/asset-movements/**").hasAuthority("MOVEMENT_WRITE")
                .requestMatchers(HttpMethod.PUT, "/api/asset-movements/**").hasAuthority("MOVEMENT_WRITE")
                .requestMatchers(HttpMethod.DELETE, "/api/asset-movements/**").hasAuthority("MOVEMENT_WRITE")
                // Depreciation
                .requestMatchers("/api/depreciation-records", "/api/depreciation-records/**").hasAuthority("DEPRECIATION_MANAGE")
                // Audit logs
                .requestMatchers("/api/audit-logs", "/api/audit-logs/**").hasAuthority("AUDIT_READ")
                // Notifications
                .requestMatchers("/api/notifications", "/api/notifications/**").hasAuthority("NOTIFICATION_READ")
                // Anomaly / theft-risk alerts
                .requestMatchers("/api/anomaly-alerts", "/api/anomaly-alerts/**").hasAuthority("ANOMALY_READ")
                // Any other API – require admin-level permission
                .requestMatchers("/api/**").hasAuthority("USER_MANAGE")
                .anyRequest().permitAll())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
