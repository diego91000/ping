package fr.epita.assistants.ping.domain.service.authentification;

import fr.epita.assistants.ping.errors.ErrorsCode;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.UUID;

@ApplicationScoped
public class AuthService {

    @Inject
    JsonWebToken jwt;
    @Inject
    SecurityIdentity securityIdentity;

    public UUID currentUserId() {
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (Exception e) {
            throw ErrorsCode.USER_NOT_ALLOWED.get();
        }
    }

    public Boolean canAccess(UUID id) {
        return securityIdentity.hasRole("admin") || currentUserId().equals(id);
    }
}
