package fr.epita.assistants.ping.testsupport;

import fr.epita.assistants.ping.data.model.UserModel;
import fr.epita.assistants.ping.data.repository.UserRepository;
import fr.epita.assistants.ping.utils.HashUtils;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.junit.jupiter.api.BeforeEach;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.Optional;
import java.util.regex.Pattern;

import static fr.epita.assistants.ping.utils.HashUtils.encrypt;
import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertTrue;

public abstract class EndpointTestBase {
    protected static final String ROOT_ADMIN_LOGIN = "super.admin";
    protected static final String ROOT_ADMIN_PASSWORD = "SuperAdminPwd1";
    @Inject
    UserRepository userRepository;
    @ConfigProperty(name = "filesystem.default.path")
    String fileSystemRoot;
    @ConfigProperty(name = "log.file")
    Optional<String> logFile;
    @ConfigProperty(name = "error.log.file")
    Optional<String> errorLogFile;

    @BeforeEach
    void resetEverything() throws IOException {
        resetUsers();
        resetFileSystems();
        resetLogs();
    }
    private void resetUsers() {
        QuarkusTransaction.requiringNew().run(() -> {
            userRepository.deleteAll();
            UserModel admin = new UserModel();
            admin.setLogin(ROOT_ADMIN_LOGIN);
            admin.setPassword(encrypt(ROOT_ADMIN_PASSWORD));
            admin.setDisplayName("Root Admin");
            admin.setAvatar("");
            admin.setIsAdmin(true);
            userRepository.persist(admin);
        });
    }
    private void resetFileSystems() throws IOException {
        Path root = Path.of(fileSystemRoot);
        if (!Files.exists(root)) {
            Files.createDirectories(root);
            return;
        }
        try (var entries = Files.walk(root)) {
            entries.sorted(Comparator.reverseOrder()).filter(path -> !path.equals(root)).forEach(EndpointTestBase::deleteQuitely);
        }
    }
    private static void deleteQuitely(Path path) {
        try {
            Files.delete(path);
        } catch (IOException ignored) {

        }
    }
    private void resetLogs() throws IOException {
        clearIfConfigured(logFile);
        clearIfConfigured(errorLogFile);
    }
    private void clearIfConfigured(Optional<String> configuredPath) throws IOException{
        if (configuredPath.isEmpty()) {
            return;
        }
        Path path = Path.of(configuredPath.get());
        Files.createDirectories(path.getParent());
        Files.write(path, new byte[0]);
    }
    private static String encrypt(String plain) {
        try {
            return HashUtils.encrypt(plain);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
    protected String loginAs(String login, String password) {
        return given().contentType(ContentType.JSON).body(loginPayload(login, password)).when().post("/api/user/login").then().statusCode(200).extract().path("token");
    }
    protected String adminBearerToken() {
        return loginAs(ROOT_ADMIN_LOGIN, ROOT_ADMIN_PASSWORD);
    }
    protected String provisionUser(String login, String password, boolean isAdmin) {
        return given().contentType(ContentType.JSON).header("Authorization", "Bearer " + adminBearerToken()).body(createUserPayload(login, password, isAdmin)).when().post("/api/user").then().statusCode(200).extract().path("id");
    }
    protected String provisionUserAndLogin(String login, String password, boolean isAdmin) {
        provisionUser(login, password, isAdmin);
        return loginAs(login, password);
    }
    protected Response fetchUser(String id, String bearerToken) {
        return given().header("Authorization", "Bearer " + bearerToken).when().get("/api/user/" + id);
    }
    private static final Pattern LOG_TIMESTAMP = Pattern.compile("\\[\\d{2}/\\d{2}/\\d{2} - \\d{2}:\\d{2}:\\d{2}]");
    protected String readAppLog() {
        return readLogFile(logFile);
    }
    protected String readErrorLog() {
        return readLogFile(errorLogFile);
    }
    private String readLogFile(Optional<String> configuredPath) {
        if (configuredPath.isEmpty()) {
            return "";
        }
        try {
            Path path = Path.of(configuredPath.get());
            if (Files.exists(path)) {
                return Files.readString(path);
            } else {
                return "";
            }
        } catch (IOException e) {
            return "";
        }
    }
    protected void assertLogContains(String logContent, String expectedFragment){
        assertTrue(LOG_TIMESTAMP.matcher(logContent).find(), "devrait etre [dd/MM/yy - HH:mm:ss].\nLog actuel:\n" + logContent);
        assertTrue(logContent.contains(expectedFragment),"le log devrait contenir : " + expectedFragment + "\nlog actuel:\n"+logContent);
    }
    protected String loginPayload(String login, String password) {
        return "{" + jsonField("login", login) + "," + jsonField("password", password) + "}";
    }
    protected String createUserPayload(String login, String password, boolean isAdmin) {
        return "{" + jsonField("login", login) + "," + jsonField("password", password) + ",\"isAdmin\":" + isAdmin + "}";
    }
    protected String jsonField(String name, String value) {
        String formattedValue;
        if (value == null) {
            formattedValue = "null";

        } else {
            formattedValue = "\"" + value + "\"";

        }
        return "\"" + name + "\":" + formattedValue;
    }
}


























































































































































































































































