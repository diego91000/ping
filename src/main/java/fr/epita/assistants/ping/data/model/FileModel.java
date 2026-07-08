package fr.epita.assistants.ping.data.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "files")
public class FileModel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "path", nullable = false, unique = true)
    public String path;

    @Column(name = "content", columnDefinition = "text")
    public String content;

    @Column(name = "updated_at", nullable = false)
    public Instant updatedAt;
}
