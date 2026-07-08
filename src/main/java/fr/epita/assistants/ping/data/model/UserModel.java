package fr.epita.assistants.ping.data.model;

import jakarta.persistence.Table;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "users")
public class UserModel {
    @Id
    @GeneratedValue(strategy=GenerationType.UUID)
    @Column(name="id", nullable=false)
    private UUID id;
    @Column(name="avatar")
    private String avatar;
    @Column(name="display_name")
    private String displayName;
    @Column(name="is_admin", nullable=false)
    private Boolean isAdmin;
    @Column(name="login", nullable=false, unique=true)
    private String login;
    @Column(name="password", nullable=false)
    private String password;
    public UUID getId(){
      return id;
    }
    public String getAvatar(){
      return avatar;
    }
    public String getDisplayName(){
      return displayName;
    }
    public Boolean getIsAdmin(){
      return isAdmin;
    }
    public String getLogin(){
      return login;
    }
    public String getPassword(){
      return password;
    }
    public void setId(UUID id){
      this.id = id;
    }
    public void setAvatar(String avatar){
      this.avatar=avatar;
    }
    public void setDisplayName(String displayName){
      this.displayName = displayName;
    }
    public void setIsAdmin(Boolean isAdmin){
      this.isAdmin = isAdmin;
    }
    public void setLogin(String login){
      this.login = login;
    }
    public void setPassword(String password){
      this.password = password;
    }
}
