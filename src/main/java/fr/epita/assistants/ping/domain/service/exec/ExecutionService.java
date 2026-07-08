package fr.epita.assistants.ping.domain.service.exec;

import fr.epita.assistants.ping.errors.ErrorsCode;
import fr.epita.assistants.ping.presentation.api.response.filesystem.ExecResponse;
import fr.epita.assistants.ping.utils.FileSystemService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@ApplicationScoped
public class ExecutionService {

    @Inject
    FileSystemService fileSystemService;

    public ExecResponse run(String path) {
        if (path == null || path.isBlank() || !path.endsWith(".py")) {
            ErrorsCode.INVALID_PATH.throwException();
        }
        Path file = fileSystemService.resolvePath(path);
        if (!file.toFile().exists() || file.toFile().isDirectory()) {
            ErrorsCode.FILE_NOT_FOUND.throwException();
        }

        try {
            Process process = new ProcessBuilder("python3", file.toString())
                    .directory(file.getParent().toFile())
                    .start();
            CompletableFuture<String> stdoutFuture = CompletableFuture.supplyAsync(() -> {
              try {
                return new String(process.getInputStream().readAllBytes());
              } catch (IOException e ) {
                return "";
              }
            });
            CompletableFuture<String> stderrFuture = CompletableFuture.supplyAsync(() -> {
              try {
                return new String(process.getErrorStream().readAllBytes());
              } catch (IOException e) {
                return "";
              }
            });
            boolean finished = process.waitFor(5, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return new ExecResponse("", "Temps d'exécution dépassé (5 secondes)", -1);
            }

            return new ExecResponse(stdoutFuture.join(), stderrFuture.join(), process.exitValue());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw ErrorsCode.INTERNAL_ERROR.get();
        } catch (IOException e) {
          throw ErrorsCode.INTERNAL_ERROR.get();
        }
    }
}
