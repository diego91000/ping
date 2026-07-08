package fr.epita.assistants.ping.converter;

import fr.epita.assistants.ping.data.model.UserModel;
import fr.epita.assistants.ping.presentation.api.response.user.LoginResponse;
import fr.epita.assistants.ping.presentation.api.response.user.UserResponse;

import java.util.List;

public class UserConverter {
    public static UserResponse toUserResponse(UserModel model) {
        if (model == null) {
            return null;
        }
        return new UserResponse(
                model.getId(),
                model.getLogin(),
                model.getDisplayName(),
                model.getIsAdmin(),
                model.getAvatar()
        );
    }

    public static List<UserResponse> toUserResponses(List<UserModel> models) {
        if (models == null) {
            return null;
        }

        return models.stream().map(UserConverter::toUserResponse).toList();
    }

    public static LoginResponse toLoginResponse(String token) {
        if (token == null) {
            return null;
        }
        return new LoginResponse(token);
    }
}
