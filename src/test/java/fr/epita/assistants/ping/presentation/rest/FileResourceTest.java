package fr.epita.assistants.ping.presentation.rest;

import fr.epita.assistants.ping.testsupport.EndpointTestBase;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class FileResourceTest extends EndpointTestBase {
    @ConfigProperty(name = "filesystem.default.path")
    String fileSystemRoot;

    private String userToken() {
        return provisionUserAndLogin("file.user",
                "FilePassword", false);
    }

    private Path root() {
        return Path.of(fileSystemRoot);
    }

    private Response createFile(String token, String relativePath) {
        String body = "{" + jsonField("relativePath", relativePath) + "}";
        return given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(body)
                .when()
                .post("/api/files");
    }

    private Response deleteFile(String token, String relativePath) {
        String body = "{" + jsonField("relativePath", relativePath) + "}";
        return given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(body)
                .when()
                .delete("/api/files");
    }

    private Response moveFile(String token, String src, String dst) {
        String body = "{" + jsonField("src", src) + ","
                + jsonField("dst", dst) + "}";
        return given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(body)
                .when()
                .put("/api/files/move");
    }


    private Response readFile(String token, String relativePath) {
        return given()
                .header("Authorization", "Bearer " + token)
                .queryParam("path", relativePath)
                .when()
                .get("/api/files");
    }

    private Response uploadFile(String token, String path, byte[] body) {
        return given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.BINARY)
                .queryParam("path", path)
                .body(body)
                .when()
                .post("/api/files/upload");
    }

    //                  ==== READ ====
    @Test
    void readFileReturnsContent() throws IOException {
        Files.writeString(root().resolve("hello.txt"), "hello world");
        readFile(userToken(), "hello.txt")
                .then()
                .statusCode(200)
                .contentType(ContentType.BINARY)
                .body(equalTo("hello world"));
    }

    @Test
    void readMissingFileReturns404() {
        readFile(userToken(), "missing.txt")
                .then()
                .statusCode(404)
                .body("message", equalTo("The file could not be found"));
    }

    @Test
    void readFolderAsFileReturns404() throws IOException {
        Files.createDirectories(root().resolve("folder"));
        readFile(userToken(), "folder")
                .then()
                .statusCode(404)
                .body("message", equalTo("The file could not be found"));
    }

    @Test
    void readFileWithBlankPathReturns400() {
        readFile(userToken(), "")
                .then()
                .statusCode(400)
                .body("message", equalTo("The relative path is invalid"));
    }

    @Test
    void readFileWithoutTokenReturns401() {
        given()
                .queryParam("path", "hello.txt")
                .when()
                .get("/api/files")
                .then()
                .statusCode(401);
    }

    //                  ==== CREATE ====
    @Test
    void createFileCreatesEmptyFile() {
        createFile(userToken(), "created.txt")
                .then()
                .statusCode(201)
                .body(is(emptyString()));

        assertTrue(Files.exists(root().resolve("created.txt")));
        assertFalse(Files.isDirectory(root().resolve("created.txt")));
    }

    @Test
    void createExistingFileReturns409() throws IOException {
        Files.writeString(root().resolve("exist.txt"), "hello world");
        createFile(userToken(), "exist.txt")
                .then()
                .statusCode(409)
                .body("message", equalTo("The file already exists"));
    }

    @Test
    void createFileWithBlankPathReturns400() {
        createFile(userToken(), "")
                .then()
                .statusCode(400)
                .body("message", equalTo("The relative path is invalid"));
    }

    //                  ==== UPLOAD ====
    @Test
    void uploadFileCreatesFileWithContent() throws IOException {
        uploadFile(userToken(), "upload.txt", "uploaded content".getBytes())
                .then()
                .statusCode(201)
                .body(is(emptyString()));

        assertEquals("uploaded content", Files.readString(root().resolve(
                "upload.txt")));
    }

    @Test
    void uploadFileOverwriteExistingFile() throws IOException {
        Files.writeString(root().resolve("upload.txt"), "old content");
        uploadFile(userToken(), "upload.txt", "new content".getBytes())
                .then()
                .statusCode(201)
                .body(is(emptyString()));

        assertEquals("new content", Files.readString(root().resolve("upload" +
                ".txt")));
    }

    @Test
    void uploadFileWithBlankPathReturns400() {
        uploadFile(userToken(), "", "content".getBytes())
                .then()
                .statusCode(400)
                .body("message", equalTo("The relative path is invalid"));
    }

    @Test
    void uploadFilePathTraversalReturns403() {
        uploadFile(userToken(), "../outside.txt", "content".getBytes())
                .then()
                .statusCode(403)
                .body("message", notNullValue());
    }

    //                  ==== DELETE ====
    @Test
    void deleteFileDeletesFile() throws IOException {
        Files.writeString(root().resolve("delete.txt"), "hello world");
        deleteFile(userToken(), "delete.txt")
                .then()
                .statusCode(204)
                .body(is(emptyString()));

        assertFalse(Files.exists(root().resolve("delete.txt")));
    }

    @Test
    void deleteMissingFileReturns404() {
        deleteFile(userToken(), "missing.txt")
                .then()
                .statusCode(404)
                .body("message", equalTo("The file could not be found"));
    }

    @Test
    void deleteFolderAsFileReturns404() throws IOException {
        Files.createDirectories(root().resolve("folder"));
        deleteFile(userToken(), "folder")
                .then()
                .statusCode(404)
                .body("message", equalTo("The file could not be found"));

        assertTrue(Files.isDirectory(root().resolve("folder")));
    }

    @Test
    void deleteFileWithBlankPathReturns400() {
        deleteFile(userToken(), "")
                .then()
                .statusCode(400)
                .body("message", equalTo("The relative path is invalid"));
    }

    @Test
    void deleteFilePathTraversalReturns403() {
        deleteFile(userToken(), "../outside.txt")
                .then()
                .statusCode(403)
                .body("message", notNullValue());
    }

    //                  ==== MOVE ====
    @Test
    void moveFileMovesFileToAnotherFolder() throws IOException {
        Files.createDirectories(root().resolve("folder"));
        Files.writeString(root().resolve("source.txt"), "hello world");
        moveFile(userToken(), "source.txt", "folder/destination.txt")
                .then()
                .statusCode(204)
                .body(is(emptyString()));

        assertFalse(Files.exists(root().resolve("source.txt")));
        assertEquals("hello world", Files.readString(root().resolve("folder" +
                "/destination.txt")));
    }

    @Test
    void moveFileRenamesFile() throws IOException {
        Files.writeString(root().resolve("old.txt"), "hello world");
        moveFile(userToken(), "old.txt", "new.txt")
                .then()
                .statusCode(204)
                .body(is(emptyString()));

        assertFalse(Files.exists(root().resolve("old.txt")));
        assertEquals("hello world",
                Files.readString(root().resolve("new.txt")));
    }

    @Test
    void moveMissingSourceReturns404() {
        moveFile(userToken(), "missing.txt", "destination.txt")
                .then()
                .statusCode(404)
                .body("message", equalTo("The file could not be found"));
    }

    @Test
    void moveToExistingDestinationReturns409() throws IOException {
        Files.writeString(root().resolve("source.txt"), "source");
        Files.writeString(root().resolve("destination.txt"), "destination");
        moveFile(userToken(), "source.txt", "destination.txt")
                .then()
                .statusCode(409)
                .body("message", equalTo("The file already exists"));

        assertEquals("source", Files.readString(root().resolve("source.txt")));
        assertEquals("destination", Files.readString(root().resolve(
                "destination.txt")));
    }

    @Test
    void moveWithBlankSourceReturns400() throws IOException {
        moveFile(userToken(), "", "destination.txt")
                .then()
                .statusCode(400)
                .body("message", equalTo("The relative path is invalid"));
    }

    @Test
    void moveWithBlankDestinationReturns400() throws IOException {
        Files.writeString(root().resolve("source.txt"), "source");
        moveFile(userToken(), "source.txt", "")
                .then()
                .statusCode(400)
                .body("message", equalTo("The relative path is invalid"));
    }

    @Test
    void moveSourcePathTraversalReturns403() {
        moveFile(userToken(), "../outside.txt", "destination.txt")
                .then()
                .statusCode(403)
                .body("message", notNullValue());
    }

    @Test
    void moveDestinationPathTraversalReturns403() throws IOException {
        Files.writeString(root().resolve("source.txt"), "source");
        moveFile(userToken(), "source.txt", "../outside.txt")
                .then()
                .statusCode(403)
                .body("message", notNullValue());
        assertTrue(Files.exists(root().resolve("source.txt")));
    }
}
