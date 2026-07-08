package fr.epita.assistants.ping.utils;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import java.lang.reflect.Field;
import java.nio.file.Path;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

public final class TestSupport {
    private TestSupport(){
    }
    public static FileSystemService newFileSystemService(Path root){
        FileSystemService service = new FileSystemService();
        setField(service, "filesystemDefaultPath", root.toAbsolutePath().toString());
        return service;
    }
    public static void injectDependency(Object target, Object dependency) {
        Class<?> dependencyType = dependency.getClass();
        for(Field field :  target.getClass().getDeclaredFields()){
            if(field.getType().isAssignableFrom(dependencyType)){
                field.setAccessible(true);
                try{
                    field.set(target, dependency);
                    return;
                }
                catch (IllegalAccessException e){
                    throw new IllegalStateException("Error with trying injection " + dependencyType.getSimpleName()+" dans "+ target.getClass().getSimpleName(), e);
                }
            }
        }
        fail("Aucun champ de type "+ dependencyType.getSimpleName()+" trouve dans "+target.getClass().getSimpleName());
    }
    public static void setField(Object target, String fieldName, Object value){
        try {
            Field field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        }
        catch(ReflectiveOperationException e) {
            throw new IllegalStateException ( "Impossible de postionner le champ " + fieldName + " sur " + target.getClass().getSimpleName(), e);
        }
    }
    public static void assertHttpStatus(Runnable action, Response.Status expectedStatus) {
        try {
            action.run();
            fail("Une WebApplicationException avec le statut " + expectedStatus + " devait etre la mais non au final");

        }
        catch (WebApplicationException e){
            assertThat(e.getResponse().getStatus()).isEqualTo(expectedStatus.getStatusCode());
        }
    }
}
