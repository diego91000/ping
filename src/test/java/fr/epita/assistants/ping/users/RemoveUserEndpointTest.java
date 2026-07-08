package fr.epita.assistants.ping.users;

import fr.epita.assistants.ping.testsupport.EndpointTestBase;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static io.restassured.RestAssured.given;
@QuarkusTest
public class RemoveUserEndpointTest extends EndpointTestBase {
    @Test
    void testAdminSuccessfullyDeleteUser(){
        String targetId = provisionUser("temp.guy", "pass123", false);
        String adminToken = adminBearerToken();
        given().header("Authorization", "Bearer " + adminToken).when().delete("/api/user/" + targetId).then().statusCode(204);
        fetchUser(targetId, adminToken).then().statusCode(404);
    }
    @Test
    void testNormalUserCannotDeleteSomeoneElse(){
        String targetId = provisionUser("innocent.user", "pass123", false);
        String normalUserToken = provisionUserAndLogin("hacker.wannabe", "pass123", false);
        given().header("Authorization", "Bearer "+ normalUserToken).when().delete("/api/user/" + targetId).then().statusCode(403);
    }
    @Test
    void testAnotherNormalUserFailsToDelete(){
        String anotherTargetId = provisionUser("poor.guy", "pass123", false);
        String anotherNormalToken = provisionUserAndLogin("random.dude", "pass123", false);
        given().header("Authorization","Bearer "+ anotherNormalToken).when().delete("/api/user/"+anotherTargetId).then().statusCode(403);
    }
    @Test
    void testDeleteFailsWithoutAuthentification(){
        String targetId = provisionUser("ghost.target", "pass123", false);
        given().when().delete("/api/user/"+ targetId).then().statusCode(401);
    }
    @Test
    void testDeletingNonExistentUserReturns404(){
        String fakeId = UUID.randomUUID().toString();
        String adminToken = adminBearerToken();
        given().header("Authorization", "Bearer " + adminToken).when().delete("/api/user/" + fakeId).then().statusCode(404);
    }
}
