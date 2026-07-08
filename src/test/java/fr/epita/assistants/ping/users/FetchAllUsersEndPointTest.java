package fr.epita.assistants.ping.users;

import fr.epita.assistants.ping.testsupport.EndpointTestBase;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class FetchAllUsersEndPointTest extends EndpointTestBase {
    @Test
    void testAdminCanRetriveUserList(){
        String adminToken = adminBearerToken();
        given().header("Authorization", "Bearer " + adminToken).when().get("/api/user/all").then().statusCode(200);
    }
    @Test
    void testUserListIncludesNewlyCreatedUsers(){
        provisionUser("alice.wonder", "pass123", false);
        provisionUser("bob.builder", "pass123", false);
        String adminToken = adminBearerToken();
        given().header("Authorization", "Bearer " + adminToken).when().get("/api/user/all").then().statusCode(200).body("login", hasItems("alice.wonder", "bob.builder")).body("displayName", hasItems("Alice Wonder"));
    }
    @Test
    void testPasswordsAreHiddenInUserList(){
        provisionUser("secret.keeper", "topsecret", false);
        String adminToken = adminBearerToken();
        given().header("Authorization", "Bearer "+ adminToken).when().get("/api/user/all").then().statusCode(200).body("password", everyItem(nullValue()));
    }
    @Test
    void testNormalUserCannotAccessUserList(){
        String normalUserToken = provisionUserAndLogin("nosy.neighbor", "pass123", false);
        given().header("Authorization", "Bearer "+ normalUserToken).when().get("/api/user/all").then().statusCode(403);
    }
    @Test
    void testAnonymousRequestIsDenied(){
        given().when().get("/api/user/all").then().statusCode(401);
    }
}
