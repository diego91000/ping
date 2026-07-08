package fr.epita.assistants.ping.presentation.api.response.user;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.UUID;

@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    public UUID id;
    public String login;
    public String displayName;
    public Boolean isAdmin;
    public String avatar;
}
