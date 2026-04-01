package com.example.fabritrack.controller;

import com.example.fabritrack.dto.LoginRequest;
import com.example.fabritrack.dto.LoginResponse;
import com.example.fabritrack.dto.SignupResponse;
import com.example.fabritrack.dto.ErrorResponse;
import com.example.fabritrack.dto.ApproveUserRequest;
import com.example.fabritrack.dto.MeResponse;
import com.example.fabritrack.dto.UpdateProfileRequest;
import com.example.fabritrack.entity.User;
import com.example.fabritrack.repository.UserRepository;
import com.example.fabritrack.security.JwtService;
import com.example.fabritrack.service.AuditLogService;
import com.example.fabritrack.service.ProfileImageService;
import com.example.fabritrack.service.RolePermissionService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ProfileImageService profileImageService;
    private final AuditLogService auditLogService;
    private final RolePermissionService rolePermissionService;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
                          ProfileImageService profileImageService, AuditLogService auditLogService,
                          RolePermissionService rolePermissionService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.profileImageService = profileImageService;
        this.auditLogService = auditLogService;
        this.rolePermissionService = rolePermissionService;
    }

    @GetMapping
    public List<User> findAll() {
        return userRepository.findAll();
    }

    /** List users pending admin approval (Admin only). */
    @GetMapping("/pending")
    public List<User> findPendingApproval() {
        return userRepository.findByStatus(User.UserStatus.PENDING_APPROVAL);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> findById(@PathVariable UUID id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<User> create(@RequestBody User user) {
        if (user.getEmail() != null && userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        User saved = userRepository.save(user);
        auditLogService.log("User", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.CREATE,
                "Created user: " + saved.getEmail(), null);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@RequestBody User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setStatus(User.UserStatus.PENDING_APPROVAL);
        if (user.getRole() == null) {
            user.setRole(com.example.fabritrack.entity.Role.IT);
        }
        if (user.getDepartment() == null) {
            user.setDepartment(com.example.fabritrack.entity.Department.OPERATIONS);
        }
        if (user.getFirstName() == null || user.getFirstName().isBlank()) {
            user.setFirstName(user.getEmail().split("@")[0]);
        }
        if (user.getLastName() == null || user.getLastName().isBlank()) {
            user.setLastName(".");
        }
        User saved = userRepository.save(user);
        auditLogService.log("User", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.CREATE,
                "Sign up (pending approval): " + saved.getEmail(), null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SignupResponse(SignupResponse.MESSAGE, saved));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.email() == null || request.password() == null) {
            return ResponseEntity.badRequest().build();
        }
        return userRepository.findByEmail(request.email())
                .filter(user -> passwordEncoder.matches(request.password(), user.getPassword()))
                .map(user -> {
                    if (user.getStatus() == User.UserStatus.PENDING_APPROVAL) {
                        return ResponseEntity.<ErrorResponse>status(HttpStatus.FORBIDDEN)
                                .body(ErrorResponse.forStatus(user.getStatus().name()));
                    }
                    if (user.getStatus() == User.UserStatus.INACTIVE || user.getStatus() == User.UserStatus.SUSPENDED) {
                        return ResponseEntity.<ErrorResponse>status(HttpStatus.FORBIDDEN)
                                .body(ErrorResponse.forStatus(user.getStatus().name()));
                    }
                    auditLogService.log("User", user.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.LOGIN,
                            "Login: " + user.getEmail(), user);
                    List<String> permissions = new ArrayList<>(rolePermissionService.getPermissionNamesForRole(user.getRole()));
                    return ResponseEntity.<LoginResponse>ok(new LoginResponse(jwtService.generateToken(user), user, permissions));
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    /** Get the currently authenticated user's profile and permissions. */
    @GetMapping("/me")
    public ResponseEntity<MeResponse> getCurrentUser() {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return userRepository.findById(userId)
                .map(user -> {
                    List<String> permissions = new ArrayList<>(rolePermissionService.getPermissionNamesForRole(user.getRole()));
                    return ResponseEntity.<MeResponse>ok(new MeResponse(user, permissions));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Update the currently authenticated user's profile. */
    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest request) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return userRepository.findById(userId)
                .map(existing -> {
                    if (request.firstName() != null && !request.firstName().isBlank()) {
                        existing.setFirstName(request.firstName().trim());
                    }
                    if (request.lastName() != null && !request.lastName().isBlank()) {
                        existing.setLastName(request.lastName().trim());
                    }
                    if (request.email() != null && !request.email().isBlank()) {
                        String newEmail = request.email().trim();
                        if (!newEmail.equals(existing.getEmail())) {
                            if (userRepository.findByEmail(newEmail).isPresent()) {
                                return ResponseEntity.<String>status(HttpStatus.CONFLICT).body("Email already in use");
                            }
                            existing.setEmail(newEmail);
                        }
                    }
                    if (request.phone() != null) {
                        existing.setPhone(request.phone().isBlank() ? null : request.phone().trim());
                    }
                    if (request.newPassword() != null && !request.newPassword().isBlank()) {
                        if (request.currentPassword() == null || request.currentPassword().isBlank()) {
                            return ResponseEntity.<String>status(HttpStatus.BAD_REQUEST).body("Current password required to change password");
                        }
                        if (!passwordEncoder.matches(request.currentPassword(), existing.getPassword())) {
                            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Current password is incorrect");
                        }
                        existing.setPassword(passwordEncoder.encode(request.newPassword()));
                    }
                    User saved = userRepository.save(existing);
                    auditLogService.log("User", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE,
                            "Updated profile", saved);
                    return ResponseEntity.<User>ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Upload or replace the current user's profile image. Allowed: JPEG, PNG, GIF, WebP, max 5 MB. */
    @PutMapping("/me/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("No file provided");
        }
        return userRepository.findById(userId)
                .map(user -> {
                    try {
                        String oldPath = user.getProfileImagePath();
                        String relativePath = profileImageService.saveProfileImage(userId, file);
                        if (relativePath == null) {
                            return ResponseEntity.badRequest().body("Invalid or empty image");
                        }
                        if (oldPath != null && !oldPath.equals(relativePath)) {
                            try {
                                profileImageService.deleteProfileImage(oldPath);
                            } catch (IOException ignored) {
                                // old file may already be missing
                            }
                        }
                        user.setProfileImagePath(relativePath);
                        User saved = userRepository.save(user);
                        return ResponseEntity.<User>ok(saved);
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.badRequest().body(e.getMessage());
                    } catch (IOException e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to save image");
                    } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to save image");
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Remove the current user's profile image. */
    @DeleteMapping("/me/avatar")
    public ResponseEntity<?> deleteAvatar() {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return userRepository.findById(userId)
                .map(user -> {
                    try {
                        if (user.getProfileImagePath() != null) {
                            profileImageService.deleteProfileImage(user.getProfileImagePath());
                            user.setProfileImagePath(null);
                        }
                        User saved = userRepository.save(user);
                        return ResponseEntity.ok(saved);
                    } catch (IOException e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete image");
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Get the current user's profile image. Returns 404 if none set. */
    @GetMapping(value = "/me/avatar", produces = { MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE, MediaType.IMAGE_GIF_VALUE, "image/webp" })
    public ResponseEntity<byte[]> getMyAvatar() {
        UUID userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return userRepository.findById(userId)
                .map(User::getProfileImagePath)
                .flatMap(path -> {
                    if (path == null || path.isBlank()) return Optional.empty();
                    try {
                        ProfileImageService.ImageResult result = profileImageService.loadProfileImage(path);
                        return Optional.ofNullable(result);
                    } catch (IOException e) {
                        return Optional.empty();
                    }
                })
                .map(result -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(result.contentType()));
                    headers.setCacheControl("private, max-age=3600");
                    return ResponseEntity.ok().headers(headers).body(result.bytes());
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Get a user's profile image by id. Use this for dashboard and other views (e.g. img src="/api/users/{id}/avatar"). */
    @GetMapping(value = "/{id}/avatar", produces = { MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE, MediaType.IMAGE_GIF_VALUE, "image/webp" })
    public ResponseEntity<byte[]> getUserAvatar(@PathVariable UUID id) {
        return userRepository.findById(id)
                .map(User::getProfileImagePath)
                .flatMap(path -> {
                    if (path == null || path.isBlank()) return Optional.empty();
                    try {
                        ProfileImageService.ImageResult result = profileImageService.loadProfileImage(path);
                        return Optional.ofNullable(result);
                    } catch (IOException e) {
                        return Optional.empty();
                    }
                })
                .map(result -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(result.contentType()));
                    headers.setCacheControl("private, max-age=3600");
                    return ResponseEntity.ok().headers(headers).body(result.bytes());
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            return null;
        }
        try {
            return UUID.fromString(auth.getPrincipal().toString());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> update(@PathVariable UUID id, @RequestBody User user) {
        return userRepository.findById(id)
                .map(existing -> {
                    user.setId(id);
                    user.setCreatedAt(existing.getCreatedAt());
                    if (user.getPassword() != null && !user.getPassword().isEmpty()) {
                        user.setPassword(passwordEncoder.encode(user.getPassword()));
                    } else {
                        user.setPassword(existing.getPassword());
                    }
                    User saved = userRepository.save(user);
                    auditLogService.log("User", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE,
                            "Updated user: " + saved.getEmail(), null);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.findById(id).ifPresent(u ->
                auditLogService.log("User", id.toString(), com.example.fabritrack.entity.AuditLog.AuditAction.DELETE,
                        "Deleted user: " + u.getEmail(), null));
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /** Approve a user who signed up (sets status to ACTIVE). Admin can set role in request body. Admin only. */
    @PostMapping("/{id}/approve")
    public ResponseEntity<User> approve(@PathVariable UUID id, @RequestBody(required = false) ApproveUserRequest request) {
        return userRepository.findById(id)
                .filter(u -> u.getStatus() == User.UserStatus.PENDING_APPROVAL)
                .map(user -> {
                    user.setStatus(User.UserStatus.ACTIVE);
                    if (request != null && request.role() != null && !request.role().isBlank()) {
                        try {
                            user.setRole(com.example.fabritrack.entity.Role.valueOf(request.role().trim().toUpperCase()));
                        } catch (IllegalArgumentException ignored) {
                            // keep existing role if invalid
                        }
                    }
                    User saved = userRepository.save(user);
                    auditLogService.log("User", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE,
                            "Approved user: " + saved.getEmail() + (saved.getRole() != null ? " (role: " + saved.getRole() + ")" : ""), null);
                    return ResponseEntity.<User>ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Reject a pending user (sets status to INACTIVE). Admin only. */
    @PostMapping("/{id}/reject")
    public ResponseEntity<User> reject(@PathVariable UUID id) {
        return userRepository.findById(id)
                .filter(u -> u.getStatus() == User.UserStatus.PENDING_APPROVAL)
                .map(user -> {
                    user.setStatus(User.UserStatus.INACTIVE);
                    User saved = userRepository.save(user);
                    auditLogService.log("User", saved.getId().toString(), com.example.fabritrack.entity.AuditLog.AuditAction.UPDATE,
                            "Rejected user (pending approval): " + saved.getEmail(), null);
                    return ResponseEntity.<User>ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
