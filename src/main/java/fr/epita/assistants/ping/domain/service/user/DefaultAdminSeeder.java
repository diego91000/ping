package fr.epita.assistants.ping.domain.service.user;

import fr.epita.assistants.ping.data.repository.UserRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import fr.epita.assistants.ping.data.model.UserModel;
@ApplicationScoped
public class DefaultAdminSeeder {

    @Inject
    UserService userService;

    @Inject
    UserRepository userRepository;

    void onStart(@Observes StartupEvent event) {
        QuarkusTransaction.requiringNew().run(() -> {
          UserModel admin = userRepository.findByLogin("admin.root");
          if(admin == null){
            userService.create("admin.root", "adminpwd", true);
          }
          else{
            userService.update(admin.getId(), "adminpwd", null, null);
            if(admin.getIsAdmin() == null || !admin.getIsAdmin()){
              admin.setIsAdmin(true);
            }
          }
        });
    }
}
