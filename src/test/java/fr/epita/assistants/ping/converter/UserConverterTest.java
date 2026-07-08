package fr.epita.assistants.ping.converter;
import fr.epita.assistants.ping.data.model.UserModel;
import fr.epita.assistants.ping.presentation.api.response.user.LoginResponse;
import fr.epita.assistants.ping.presentation.api.response.user.UserResponse;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserConverterTest {
    private static UserModel sampleUser() {
        UserModel user = new UserModel();
        user.setId(UUID.randomUUID());
        user.setLogin("bob.toto");
        user.setDisplayName("bob toto");
        user.setIsAdmin(Boolean.TRUE);
        user.setAvatar("test");
        user.setPassword("1234mdp");
        return user;

    }
    @Test
    void toUserResponse_mapsEveryField() {
        UserModel user = sampleUser();
        UserResponse response = UserConverter.toUserResponse(user);
        assertThat(response).isNotNull();
        assertThat(response.id).isEqualTo(user.getId());
        assertThat(response.login).isEqualTo("bob.toto");
        assertThat(response.displayName).isEqualTo("bob toto");
        assertThat(response.isAdmin).isTrue();
        assertThat(response.avatar).isEqualTo("test");

    }
    @Test
    void toUserResponse_neverExposesThePassword(){
        UserModel user = sampleUser();
        UserResponse response = UserConverter.toUserResponse(user);
        assertThat(response.login).isNotEqualTo(user.getPassword());
        assertThat(response.avatar).isNotEqualTo(user.getPassword());

    }
    @Test
    void toUserResponse_onNull_returnsNull(){
        assertThat(UserConverter.toUserResponse(null)).isNull();
    }
    @Test
    void toUserResponses_mapsListAndPreservesOrder(){
        UserModel first = sampleUser();
        UserModel second = new UserModel();
        second.setLogin("jaja_poto");
        second.setDisplayName("Jaja Toto");
        second.setIsAdmin(Boolean.FALSE);
        second.setAvatar("");
        List<UserResponse> responses = UserConverter.toUserResponses(List.of(first, second));
        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).login).isEqualTo("bob.toto");
        assertThat(responses.get(1).login).isEqualTo("jaja_poto");
        assertThat(responses.get(1).isAdmin).isFalse();

    }
    @Test
    void toUserResponses_onEmptyList_returnsEmptyList(){
        assertThat(UserConverter.toUserResponses(List.of())).isEmpty();
    }
    @Test
    void toUserResponses_onNull_returnsNull(){
        assertThat(UserConverter.toUserResponses(null)).isNull();
    }
    @Test
    void toLoginResponse_wrapsTheToken(){
        LoginResponse response = UserConverter.toLoginResponse("a.jwt.token");
        assertThat(response).isNotNull();
        assertThat(response.token).isEqualTo("a.jwt.token");
    }
    @Test
    void toLoginResponse_onNull_returnsNull() {
        assertThat(UserConverter.toLoginResponse(null)).isNull();
    }
}



























































































































































































































































































