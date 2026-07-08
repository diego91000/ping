package fr.epita.assistants.ping.users;

import fr.epita.assistants.ping.testsupport.EndpointTestBase;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.notNullValue;
@QuarkusTest
public class RenewAuthTokenTest extends EndpointTestBase {
    @Test
    void testValidTokenGetsRenewed(){
        String currToken = provisionUserAndLogin("active.user", "pass123", false);
        given().header("Authorization", "Bearer "+ currToken).when().get("/api/user/refresh").then().statusCode(200).body("token", notNullValue());
    }
    @Test
    void testFakeTokenIsRejected(){
        String fakeToken = "nul.token";
        given().header("Authorization", "Bearer " + fakeToken).when().get("/api/user/refresh").then().statusCode(401);
    }
    @Test
    void testMissingTokenIsRejected(){
        given().when().get("/api/user/refresh").then().statusCode(401);
    }
}
