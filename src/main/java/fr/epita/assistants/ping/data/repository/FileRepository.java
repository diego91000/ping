package fr.epita.assistants.ping.data.repository;

import fr.epita.assistants.ping.data.model.FileModel;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.UUID;

@ApplicationScoped
public class FileRepository implements PanacheRepositoryBase<FileModel, UUID> {
    public FileModel findByPath(String path) {
        return find("path", path).firstResult();
    }
}
