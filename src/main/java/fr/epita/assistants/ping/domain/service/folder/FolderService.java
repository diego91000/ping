package fr.epita.assistants.ping.domain.service.folder;

import fr.epita.assistants.ping.errors.ErrorsCode;
import fr.epita.assistants.ping.presentation.api.response.filesystem.FSEntryResponse;
import fr.epita.assistants.ping.utils.FileSystemService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

@ApplicationScoped
public class FolderService {
    @Inject
    FileSystemService fileSystemService;

    public List<FSEntryResponse> list(String relativePath) {
        // Beware relative path each time
        Path folder;

        //if blank we take the root
        if (relativePath == null || relativePath.isBlank()) {
            folder = fileSystemService.resolvePath(".");
        } else {
            folder = fileSystemService.resolvePath(relativePath);
        }

        checkFolderExistence(folder);

        Path filesystemRoot = fileSystemService.resolvePath(".");

        List<FSEntryResponse> entries = new ArrayList<>();
        try (DirectoryStream<Path> folderStream =
                     Files.newDirectoryStream(folder)) {
            for (Path child : folderStream) {
                entries.add(toResponse(filesystemRoot, child));
            }
        } catch (IOException e) {
            throw ErrorsCode.INTERNAL_ERROR.get();
        }
        return entries;
    }

    public void create(String relativePath) {
        Path folder = isValidPath(relativePath);

        if (Files.exists(folder)) {
            ErrorsCode.FOLDER_ALREADY_EXISTS.throwException();
        }

        Path parent = folder.getParent();
        if (parent == null || !Files.exists(parent) || !Files.isDirectory(parent)) {
            ErrorsCode.FILESYSTEM_NOT_FOUND.throwException();
        }

        try {
            Files.createDirectories(folder);
        } catch (IOException e) {
            throw ErrorsCode.INTERNAL_ERROR.get();
        }
    }

    public void delete(String relativePath) {
        Path folder = isValidPath(relativePath);
        checkFolderExistence(folder);

        // Be careful: if the folder is the root you should only empty it and
        // not remove the root folder of the project.
        Path filesystemRoot = fileSystemService.resolvePath(".");
        if (folder.equals(filesystemRoot)) {
            emptyDirectory(folder);
            return;
        }
        deleteRecursively(folder);
    }

    public void move(String src, String dst) {
        if (src == null || src.isBlank()) {
            ErrorsCode.INVALID_PATH.throwException();
        }
        if (dst == null || dst.isBlank()) {
            ErrorsCode.INVALID_PATH.throwException();
        }

        Path source = fileSystemService.resolvePath(src);
        Path destination = fileSystemService.resolvePath(dst);
        Path filesystemRoot = fileSystemService.resolvePath(".");

        if (!Files.exists(source) || !Files.isDirectory(source)) {
            ErrorsCode.SOURCE_FOLDER_NOT_FOUND.throwException();
        }

        if (Files.exists(destination)) {
            ErrorsCode.DESTINATION_ALREADY_EXISTS.throwException();
        }

        // impossible de mettre un dossier dans ses enfants
        //
        if(!destination.startsWith(filesystemRoot)){
          ErrorsCode.INVALID_MOVE_PATH.throwException();
        }
        if(destination.startsWith(source)){
          ErrorsCode.INVALID_MOVE_PATH.throwException();
        }
        if(destination.startsWith(source)){
          ErrorsCode.INVALID_MOVE_PATH.throwException();
        }

        Path parent = destination.getParent();

        if (parent == null || !Files.exists(parent) || !Files.isDirectory(parent)) {
            ErrorsCode.FILESYSTEM_NOT_FOUND.throwException();
        }

        try {
            Files.move(source, destination);
        } catch (IOException e) {
            throw ErrorsCode.INTERNAL_ERROR.get();
        }
    }

    private Path isValidPath(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) {
            ErrorsCode.INVALID_PATH.throwException();
        }
        return fileSystemService.resolvePath(relativePath);
    }

    private FSEntryResponse toResponse(Path filesystemRoot, Path child) {
        String path = filesystemRoot.relativize(child).toString();
        String name = child.getFileName().toString();

        return new FSEntryResponse(name, path, Files.isDirectory(child));
    }

    private void checkFolderExistence(Path folder) {
        if (!Files.exists(folder) || !Files.isDirectory(folder)) {
            ErrorsCode.FOLDER_NOT_FOUND.throwException();
        }
    }

    private void emptyDirectory(Path folder) {
        try (Stream<Path> children = Files.list(folder)) {
            children.forEach(this::deleteRecursively);
        } catch (IOException e) {
            throw ErrorsCode.INTERNAL_ERROR.get();
        }
    }

    private void deleteRecursively(Path folder) {
        if (Files.isDirectory(folder)) {
            try (DirectoryStream<Path> children =
                         Files.newDirectoryStream(folder)) {
                for (Path child : children) {
                    deleteRecursively(child);
                }
            } catch (IOException e) {
                throw ErrorsCode.INTERNAL_ERROR.get();
            }
        }

        try {
            Files.deleteIfExists(folder);
        } catch (IOException e) {
            throw ErrorsCode.INTERNAL_ERROR.get();
        }
    }

}
