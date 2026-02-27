package com.example.fabritrack.repository;

import com.example.fabritrack.entity.Role;
import com.example.fabritrack.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    List<User> findByStatus(User.UserStatus status);

    /** Find users with any of the given roles and status (e.g. ACTIVE ADMIN/SECURITY for theft alerts). */
    List<User> findByRoleInAndStatus(Set<Role> roles, User.UserStatus status);
}
