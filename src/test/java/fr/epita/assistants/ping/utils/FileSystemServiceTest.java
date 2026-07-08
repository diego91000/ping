package fr.epita.assistants.ping.utils;
import jakarta.ws.rs.core.Response.Status;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
class FileSystemServiceTest {
    @TempDir
    Path rootDir;
    private FileSystemService newService(){
        return TestSupport.newFileSystemService(rootDir);
    }
    @Test
    void getRootReturnsConfDirNormAbso(){
        FileSystemService service = newService();
        Path root = service.getRoot();
        assertThat(root).isAbsolute();
        assertThat(root).isEqualTo(rootDir.toAbsolutePath().normalize());
    }
    @Test
    void resolvePathOnNullReturnRoot(){
        FileSystemService service = newService();
        Path resolved = service.resolvePath(null);
        assertThat(resolved).isEqualTo(service.getRoot());
    }
    @Test
    void resolvePathVide(){
        FileSystemService service = newService();
        Path resolved = service.resolvePath("");
        assertThat(resolved).isEqualTo(service.getRoot());
    }
    @Test
    void resolvePathSimplePath(){
        FileSystemService service = newService();
        Path resolved = service.resolvePath("subdir/file.txt");
        assertThat(resolved).isEqualTo(service.getRoot().resolve("subdir/file.txt"));
        assertThat(resolved.toString()).startsWith(service.getRoot().toString());
    }
    @Test
    void resolvePathDotIsOkay(){
        FileSystemService service = newService();
        Path resolved = service.resolvePath("subdir/../file.txt");
        assertThat(resolved).isEqualTo(service.getRoot().resolve("file.txt"));
    }
    @Test
    void resolvePathDot() {
        FileSystemService service = newService();
        TestSupport.assertHttpStatus(() -> service.resolvePath("../escape.txt"), Status.FORBIDDEN);
    }
    @Test
    void resolvePathDotMultiple() {
        FileSystemService service = newService();
        TestSupport.assertHttpStatus(() -> service.resolvePath("../../../etc/passwd"), Status.FORBIDDEN);
    }
    @Test
    void resolvePathDotDotForbidden(){
        FileSystemService service = newService();
        TestSupport.assertHttpStatus(() -> service.resolvePath(".."), Status.FORBIDDEN);
    }
    @Test
    void pathAbsoluteForbidden(){
        FileSystemService service = newService();
        TestSupport.assertHttpStatus(() -> service.resolvePath("/etc/passwd"), Status.FORBIDDEN);

    }


}