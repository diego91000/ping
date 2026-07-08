package fr.epita.assistants.ping.data.repository;

import fr.epita.assistants.ping.data.model.UserModel;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.UUID;

@ApplicationScoped
public class UserRepository implements PanacheRepositoryBase<UserModel, UUID> {
    public UserModel findByLogin(String login) {
        if (login == null) {
            return null;
        }
        return find("login", login).firstResult();
    }
}
