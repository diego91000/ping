package fr.epita.assistants.ping.domain.service.user;

import fr.epita.assistants.ping.data.model.UserModel;
import fr.epita.assistants.ping.data.repository.UserRepository;
import fr.epita.assistants.ping.errors.ErrorsCode;
import fr.epita.assistants.ping.utils.HashUtils;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class UserService {
    @Inject
    UserRepository userRepository;

    @Transactional
    public UserModel create(String login, String password, Boolean isAdmin) {

        validateCreation(login, password);

        if (userRepository.findByLogin(login) != null) {
            ErrorsCode.LOGIN_ALREADY_TAKEN.throwException();
        }

        UserModel user = new UserModel();
        user.setLogin(login);
        user.setPassword(encryptPassword(password));
        user.setDisplayName(defaultDisplayName(login));
        user.setAvatar("");
        user.setIsAdmin(isAdmin != null && isAdmin);

        userRepository.persist(user);
        return user;
    }

    public List<UserModel> getAll(){
        return userRepository.listAll();
    }

    public UserModel login(String login, String password) {
        if (login == null || password == null) {
            ErrorsCode.NULL_LOGIN_OR_PASSWORD.throwException();
        }

        UserModel user = userRepository.findByLogin(login);
        if (user == null) {
            ErrorsCode.INVALID_CREDENTIALS.throwException();
        }

        String decryptedPassword;
        try {
            decryptedPassword = HashUtils.decrypt(user.getPassword());
        } catch (Exception e) {
            ErrorsCode.INVALID_CREDENTIALS.throwException();
            return null;
        }

        if (!password.equals(decryptedPassword)) {
            ErrorsCode.INVALID_CREDENTIALS.throwException();
        }
        return user;
    }

    public UserModel getById(UUID id){
        if (id == null) {
            ErrorsCode.USER_NOT_FOUND.throwException();
        }

        UserModel user = userRepository.findById(id);

        if (user == null) {
            ErrorsCode.USER_NOT_FOUND.throwException();
        }
        return user;
    }

    @Transactional
    public UserModel update(UUID id, String password, String displayName, String avatar) {
        UserModel user = getById(id);
        if (password != null && !password.isBlank()) {
            user.setPassword(encryptPassword(password));
        }
        if (displayName != null && !displayName.isBlank()) {
            user.setDisplayName(displayName);
        }

        // Any blank value should be ignored (except for the avatar).
        if (avatar != null) {
            user.setAvatar(avatar);
        }

        return user;
    }

    @Transactional
    public void delete(UUID id) {
        UserModel user = getById(id);
        userRepository.delete(user);
    }

    private void validateCreation(String login, String password) {
        // login contain at most one '.' or '_'
        if (login == null || password == null) {
            ErrorsCode.NULL_LOGIN_OR_PASSWORD.throwException();
        }

        if (login.isBlank() || password.isBlank()) {
            ErrorsCode.INVALID_LOGIN_OR_PASSWORD.throwException();
        }

        Integer dots = countOccurence(login, '.');
        Integer underscore = countOccurence(login, '_');

        if (dots + underscore != 1) {
            ErrorsCode.INVALID_LOGIN_OR_PASSWORD.throwException();
        }
        String separator;
        if (dots == 1)
            separator = "\\.";
        else
            separator = "_";

        String[] parts = login.split(separator, -1);

        if (parts.length != 2 || parts[0].isBlank() || parts[1].isBlank()) {
            ErrorsCode.INVALID_LOGIN_OR_PASSWORD.throwException();
        }
    }

    private String defaultDisplayName(String login) {
        // use after validating the login
        String separator = login.contains(".") ? "\\." : "_";
        String[] parts = login.split(separator, -1);

        return capitalize(parts[0]) + " " + capitalize(parts[1]);
    }

    private String capitalize(String login) {
        // Uppercase only on first letter
        return login.substring(0, 1).toUpperCase() + login.substring(1);
    }

    public Integer countOccurence(String login, char searched) {
        // count occurence
        Integer count = 0;
        for (int i = 0; i < login.length(); i++) {
            if (login.charAt(i) == searched) {
                count++;
            }
        }
        return count;
    }

    private String encryptPassword(String password) {
        try {
            return HashUtils.encrypt(password);

        } catch (Exception e) {
            throw ErrorsCode.INTERNAL_ERROR.get();
        }
    }



}
