package com.example.fabritrack.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class ProfileImageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );
    private static final long MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    private static final String SUBDIR = "profile-images";

    @Value("${fabritrack.profile-images-dir:uploads}")
    private String baseDir;

    /**
     * Saves the uploaded image as the user's profile image. Replaces any existing image.
     * @return relative path to store in User.profileImagePath, or null if invalid
     */
    public String saveProfileImage(UUID userId, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid image type. Allowed: JPEG, PNG, GIF, WebP");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("Image too large. Maximum size: 5 MB");
        }

        Path dir = Paths.get(baseDir, SUBDIR).toAbsolutePath().normalize();
        Files.createDirectories(dir);

        String ext = getExtension(contentType);
        String filename = userId + ext;
        Path target = dir.resolve(filename).normalize();
        if (!target.startsWith(dir)) {
            throw new IOException("Invalid path");
        }

        file.transferTo(target);

        return SUBDIR + "/" + filename;
    }

    /**
     * Loads profile image bytes and returns content type. Returns null if path is null or file missing.
     */
    public ImageResult loadProfileImage(String profileImagePath) throws IOException {
        if (profileImagePath == null || profileImagePath.isBlank()) {
            return null;
        }
        Path path = Paths.get(baseDir, profileImagePath).normalize();
        if (!path.startsWith(Paths.get(baseDir).normalize())) {
            return null;
        }
        if (!Files.isRegularFile(path)) {
            return null;
        }
        byte[] bytes = Files.readAllBytes(path);
        String contentType = getContentTypeFromFilename(path.getFileName().toString());
        return new ImageResult(bytes, contentType);
    }

    /**
     * Deletes the file at the given relative path (e.g. when user removes avatar).
     */
    public void deleteProfileImage(String profileImagePath) throws IOException {
        if (profileImagePath == null || profileImagePath.isBlank()) {
            return;
        }
        Path path = Paths.get(baseDir, profileImagePath).normalize();
        if (!path.startsWith(Paths.get(baseDir).normalize())) {
            return;
        }
        Files.deleteIfExists(path);
    }

    private static String getExtension(String contentType) {
        return switch (contentType.toLowerCase()) {
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }

    private static String getContentTypeFromFilename(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    public record ImageResult(byte[] bytes, String contentType) {}
}
