package fr.epita.assistants.ping.utils;

import fr.epita.assistants.ping.data.model.UserModel;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.Set;

@ApplicationScoped
public class JwtUtils {
    public String generateToken(UserModel user) {
        long now = Instant.now().getEpochSecond();

        String role;
        if (user.getIsAdmin() != null && user.getIsAdmin()) {
            role = "admin";
        } else {
            role = "user";
        }

        // expire maximum 24h plus tard
        return Jwt.issuer("ping")
                .subject(user.getId().toString())
                .groups(Set.of(role))
                .issuedAt(now)
                .expiresAt(now + 24 * 3600)
                .sign();
    }
}
