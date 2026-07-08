package fr.epita.assistants.ping.domain.service.file;

import fr.epita.assistants.ping.data.model.FileModel;
import fr.epita.assistants.ping.data.repository.FileRepository;
import fr.epita.assistants.ping.errors.ErrorsCode;
import fr.epita.assistants.ping.utils.FileSystemService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;

@ApplicationScoped
public class FileService {

    @Inject
    FileSystemService fileSystemService;

    @Inject
    FileRepository fileRepository;

    public byte[] read(String path) {
        if (path == null || path.isBlank()) {
            ErrorsCode.INVALID_PATH.throwException();
        }
        Path filePath = fileSystemService.resolvePath(path);
        File file = filePath.toFile();
        if (!file.exists() || file.isDirectory()) {
            ErrorsCode.FILE_NOT_FOUND.throwException();
        }
        try  {
          return Files.readAllBytes(filePath);
        } catch (IOException e){
          throw ErrorsCode.INTERNAL_ERROR.get();
        }
    }

    public List<String> listAll(String path) {
        Path root = fileSystemService.getRoot();
        Path dir = fileSystemService.resolvePath(path);
        File file = dir.toFile();
        if (!file.exists() || !file.isDirectory()) {
            ErrorsCode.FOLDER_NOT_FOUND.throwException();
        }
        try (Stream<Path> walk = Files.walk(dir)) {
            return walk.filter(Files::isRegularFile)
                    .map(entry -> root.relativize(entry).toString())
                    .sorted()
                    .toList();
        } catch (IOException e) {
            throw ErrorsCode.INTERNAL_ERROR.get();
        }
    }
    @Transactional
    public void create(String path) {
        if (path == null || path.isBlank()) {
            ErrorsCode.INVALID_PATH.throwException();
        }
        Path filePath = fileSystemService.resolvePath(path);
        File file = filePath.toFile();
        if (file.exists()) {
            ErrorsCode.FILE_ALREADY_EXISTS.throwException();
        }
        try {
            Files.createDirectories(filePath.getParent());
            Files.createFile(filePath);
        } catch (IOException e) {
            throw ErrorsCode.INTERNAL_ERROR.get();
        }
        if(fileRepository.findByPath(path) == null){
          FileModel entry = new FileModel();
          entry.path = path;
          entry.content = "";
          entry.updatedAt = Instant.now();
          fileRepository.persist(entry);
        }
    }
    @Transactional
    public void delete(String path) {
        if (path == null || path.isBlank()) {
            ErrorsCode.INVALID_PATH.throwException();
        }
        Path filePath = fileSystemService.resolvePath(path);
        File file = filePath.toFile();
        if (!file.exists() || file.isDirectory()) {
            ErrorsCode.FILE_NOT_FOUND.throwException();
        }

        if(!file.delete()){
          throw ErrorsCode.INTERNAL_ERROR.get();
        }
        FileModel entry = fileRepository.findByPath(path);
        if(entry != null) {
          fileRepository.delete(entry);
        }
    }

    @Transactional
    public void upload(String path, byte[] content) {
        if (path == null || path.isBlank()) {
            ErrorsCode.INVALID_PATH.throwException();
        }
        Path filePath = fileSystemService.resolvePath(path);
        if (content == null) {
            content = new byte[0];
        }
        try {
            Files.createDirectories(filePath.getParent());
            Files.write(filePath, content);
        } catch (IOException e) {
            throw ErrorsCode.INTERNAL_ERROR.get();
        }

        String text = new String(content, StandardCharsets.UTF_8);
        FileModel entry = fileRepository.findByPath(path);
        if (entry == null) {
            entry = new FileModel();
            entry.path = path;
            entry.content = text;
            entry.updatedAt = Instant.now();
            fileRepository.persist(entry);
        } else {
            entry.content = text;
            entry.updatedAt = Instant.now();
        }
    }

    public String readFromDb(String path) {
        if (path == null || path.isBlank()) {
            ErrorsCode.INVALID_PATH.throwException();
        }
        FileModel entry = fileRepository.findByPath(path);
        if (entry == null) {
            ErrorsCode.FILE_NOT_FOUND.throwException();
        }
        return entry.content;
    }

    @Transactional
    public void move(String src, String dst) {
        if (src == null || src.isBlank() || dst == null || dst.isBlank()) {
            ErrorsCode.INVALID_PATH.throwException();
        }
        Path srcPath = fileSystemService.resolvePath(src);
        Path dstPath = fileSystemService.resolvePath(dst);
        if (!srcPath.toFile().exists()) {
            ErrorsCode.FILE_NOT_FOUND.throwException();
        }
        if (dstPath.toFile().exists()) {
            ErrorsCode.FILE_ALREADY_EXISTS.throwException();
        }
        try {
            Files.createDirectories(dstPath.getParent());
            Files.move(srcPath, dstPath);
        } catch (IOException e) {
            throw ErrorsCode.INTERNAL_ERROR.get();
        }
        FileModel entry = fileRepository.findByPath(src);
        if(entry != null){
          entry.path = dst;
          entry.updatedAt = Instant.now();
        }
    }
}
