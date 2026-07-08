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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
public class FolderResourceTest extends EndpointTestBase {
    @ConfigProperty(name = "filesystem.default.path")
    String fileSystemRoot;

    private String userToken() {
        return provisionUserAndLogin("folder.user",
                "FolderPassword", false);
    }

    private Path root() {
        return Path.of(fileSystemRoot);
    }

    private Response listFolder(String token, String path) {
        var request = given().header("Authorization", "Bearer " + token);
        if (path != null) {
            request = request.queryParam("path", path);
        }

        return request.when().get("/api/folders");
    }

    private Response createFolder(String token, String relativePath) {
        String body = "{" + jsonField("relativePath", relativePath) + "}";
        return given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(body)
                .when()
                .post("/api/folders");
    }

    private Response deleteFolder(String token, String relativePath) {
        String body = "{" + jsonField("relativePath", relativePath) + "}";
        return given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(body)
                .when()
                .delete("/api/folders");
    }

    private Response moveFolder(String token, String src, String dst) {
        String body = "{" + jsonField("src", src) + ","
                + jsonField("dst", dst) + "}";
        return given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(body)
                .when()
                .put("/api/folders/move");
    }

    // Test                     ==== LIST ====

    @Test
    void listFolderNeedsAuthentication() {
        given()
                .when()
                .get("/api/folders")
                .then()
                .statusCode(401);
    }

    @Test
    void listRootFolderByDefaultAndIsNotRecursive() throws IOException {
        // affiche que le contenu immédiat du root

        Files.createDirectories(root().resolve("folder/nested"));
        Files.writeString(root().resolve("joke.txt"),
                "My love for you is just like dirrhea, I just can't " +
                        "hold it in");

        listFolder(userToken(), null)
                .then()
                .statusCode(200)
                .body("size()", equalTo(2))
                .body("path", containsInAnyOrder("folder", "joke.txt"))
                .body("path", not(hasItem("folder/nested")));
    }

    @Test
    void listSubFolderReturnsImmediateChildren() throws IOException {
        Files.createDirectories(root().resolve("folder/image"));
        Files.writeString(root().resolve("folder/joke.txt"),
                "My love for you is just like dirrhea, I just can't " +
                        "hold it in");
        Files.writeString(root().resolve("folder/image/racoon.png")
                , "fake image");

        listFolder(userToken(), "folder")
                .then()
                .statusCode(200)
                .body("size()", equalTo(2))
                .body("name", containsInAnyOrder("image", "joke.txt"))
                .body("path", containsInAnyOrder("folder/image", "folder/joke" +
                        ".txt"))
                .body("isDirectory", containsInAnyOrder(true, false));
    }

    @Test
    void listMissingFolderReturns404WithErrorBody()  {

        listFolder(userToken(), "missing")
                .then()
                .statusCode(404)
                .body("message", notNullValue());
    }

    @Test
    void listPathTraversalReturns403()  {
        listFolder(userToken(), "../outside")
                .then()
                .statusCode(403)
                .body("message", notNullValue());
    }

    // Test                     ==== CREATE ====
    @Test
    void createFolderCreatesDirectory()  {
        createFolder(userToken(), "folder")
                .then()
                .statusCode(201)
                .body(equalTo(""));
    }

    @Test
    void createExistingFolderReturns409() throws IOException {
        Files.createDirectories(root().resolve("folder"));
        createFolder(userToken(), "folder")
                .then()
                .statusCode(409)
                .body("message", notNullValue());
    }

    @Test
    void createFolderWithBlankPathReturns400()  {
        createFolder(userToken(), "")
                .then()
                .statusCode(400)
                .body("message", notNullValue());
    }

    @Test
    void createFolderWithMissingParentReturns404()  {
        createFolder(userToken(), "missing/folder")
                .then()
                .statusCode(404)
                .body("message", notNullValue());
    }

    @Test
    void createFolderPathTraversalReturns403()  {
        createFolder(userToken(), "../outside")
                .then()
                .statusCode(403)
                .body("message", notNullValue());
    }

    // Test                     ==== DELETE ====

    @Test
    void deleteFolderDeletesRecursively() throws IOException {
        Files.createDirectories(root().resolve("folder/nested"));
        Files.writeString(root().resolve("folder/nested/joke.txt"),
                "My love for you is just like dirrhea, I just can't " +
                        "hold it in");
        deleteFolder(userToken(), "folder")
                .then()
                .statusCode(204)
                .body(equalTo(""));

        assertFalse(Files.exists(root().resolve("folder")));
    }

    @Test
    void deleteRootOnlyEmptiesRoot() throws IOException {
        String token = userToken();
        Files.createDirectories(root().resolve("folder"));
        Files.writeString(root().resolve("joke.txt"),
                "My love for you is just like dirrhea, I just can't " +
                        "hold it in");
        deleteFolder(token, ".")
                .then()
                .statusCode(204);

        assertTrue(Files.isDirectory(root()));
        try (var children = Files.list(root())) {
            assertTrue(children.findAny().isEmpty());
        }
    }

    @Test
    void deleteMissingFolderReturns404()  {

        deleteFolder(userToken(), "missing")
                .then()
                .statusCode(404)
                .body("message", notNullValue());
    }

    @Test
    void deleteFolderPathTraversalReturns403()  {

        deleteFolder(userToken(), "../outside")
                .then()
                .statusCode(403)
                .body("message", notNullValue());
    }

    @Test
    void deleteFolderWithBlankPathReturns400()  {

        deleteFolder(userToken(), "")
                .then()
                .statusCode(400)
                .body("message", notNullValue());
    }

    // Test                     ==== MOVE ====
    @Test
    void moveFolderRenamesFolderAndKeepsContent() throws IOException {
        Files.createDirectories(root().resolve("folder"));
        Files.writeString(root().resolve("folder/file.txt"), "content");
        moveFolder(userToken(), "folder", "renamed")
                .then()
                .statusCode(204)
                .body(equalTo(""));

        assertFalse(Files.exists(root().resolve("folder")));
        assertTrue(Files.isDirectory(root().resolve("renamed")));
        assertTrue(Files.exists(root().resolve("renamed/file.txt")));
    }

    @Test
    void moveFolderToAnotherParent() throws IOException {
        Files.createDirectories(root().resolve("folder"));
        Files.createDirectories(root().resolve("archive"));
        moveFolder(userToken(), "folder", "archive/folder")
                .then()
                .statusCode(204);

        assertFalse(Files.exists(root().resolve("folder")));
        assertTrue(Files.isDirectory(root().resolve("archive/folder")));
    }

    @Test
    void moveMissingSourceReturns404() {
        moveFolder(userToken(), "missing", "renamed")
                .then()
                .statusCode(404)
                .body("message", notNullValue());
    }

    @Test
    void moveToExistingDestinationReturns409() throws IOException {
        Files.createDirectories(root().resolve("folder"));
        Files.createDirectories(root().resolve("existing"));

        moveFolder(userToken(), "folder", "existing")
                .then()
                .statusCode(409)
                .body("message", notNullValue());
    }

    @Test
    void moveWithBlankSourceReturns400() {
        moveFolder(userToken(), "", "renamed")
                .then()
                .statusCode(400)
                .body("message", notNullValue());
    }

    @Test
    void movePathTraversalReturns403() throws IOException{
        Files.createDirectories(root().resolve("folder"));
        moveFolder(userToken(), "folder", "../outside")
                .then()
                .statusCode(403)
                .body("message", notNullValue());
    }

    @Test
    void moveToBlankDestinationReturns400() throws IOException{
        Files.createDirectories(root().resolve("folder"));
        moveFolder(userToken(), "folder", "")
                .then()
                .statusCode(400)
                .body("message", notNullValue());
    }
}
