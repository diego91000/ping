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

@QuarkusTest
public class ExecResourceTest extends EndpointTestBase {
    @ConfigProperty(name = "filesystem.default.path")
    String fileSystemRoot;

    private String userToken() {
        return provisionUserAndLogin("exec.user",
                "ExecPassword", false);
    }

    private Path root() {
        return Path.of(fileSystemRoot);
    }

    private Response exec(String token, String relativePath) {
        String body = "{" + jsonField("relativePath", relativePath) + "}";
        return given()
                .header("Authorization", "Bearer " + token)
                .contentType(ContentType.JSON)
                .body(body)
                .when()
                .post("/api/exec");
    }

    //                  ==== RUN ====
    @Test
    void execRunsPythonAndReturnsStdout() throws IOException {
        Files.writeString(root().resolve("hello.py"), "print(\"hello exec\")");
        exec(userToken(), "hello.py")
                .then()
                .statusCode(200)
                .body("stdout", containsString("hello exec"))
                .body("stderr", is(emptyString()))
                .body("exitCode", equalTo(0));
    }

    @Test
    void execReturnsStderrAndExitCodeOnError() throws IOException {
        Files.writeString(root().resolve("boom.py"), "raise Exception(\"boom\")");
        exec(userToken(), "boom.py")
                .then()
                .statusCode(200)
                .body("stderr", containsString("boom"))
                .body("exitCode", not(equalTo(0)));
    }

    @Test
    void execMissingFileReturns404() {
        exec(userToken(), "missing.py")
                .then()
                .statusCode(404)
                .body("message", equalTo("The file could not be found"));
    }

    @Test
    void execFolderAsFileReturns404() throws IOException {
        Files.createDirectories(root().resolve("folder.py"));
        exec(userToken(), "folder.py")
                .then()
                .statusCode(404)
                .body("message", equalTo("The file could not be found"));
    }

    @Test
    void execNonPythonFileReturns400() throws IOException {
        Files.writeString(root().resolve("script.txt"), "print(\"hello\")");
        exec(userToken(), "script.txt")
                .then()
                .statusCode(400)
                .body("message", equalTo("The relative path is invalid"));
    }

    @Test
    void execWithBlankPathReturns400() {
        exec(userToken(), "")
                .then()
                .statusCode(400)
                .body("message", equalTo("The relative path is invalid"));
    }

    @Test
    void execPathTraversalReturns403() {
        exec(userToken(), "../outside.py")
                .then()
                .statusCode(403)
                .body("message", notNullValue());
    }

    @Test
    void execWithoutTokenReturns401() {
        given()
                .contentType(ContentType.JSON)
                .body("{" + jsonField("relativePath", "hello.py") + "}")
                .when()
                .post("/api/exec")
                .then()
                .statusCode(401);
    }
}
