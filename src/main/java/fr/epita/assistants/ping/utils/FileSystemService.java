package fr.epita.assistants.ping.utils;

import fr.epita.assistants.ping.errors.ErrorsCode;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.nio.file.Path;

@ApplicationScoped
public class FileSystemService {

    @ConfigProperty(name = "filesystem.default.path")
    String filesystemDefaultPath;

    public Path getRoot() {
        return Path.of(filesystemDefaultPath).toAbsolutePath().normalize();
    }

    public Path resolvePath(String path) {
        if (path == null) {
            path = "";
        }
        Path root = getRoot();
        Path resolved = root.resolve(path).normalize();
        if (!resolved.startsWith(root)) {
            throw ErrorsCode.PATH_FORBIDDEN.get();
        }
        return resolved;
    }
}
