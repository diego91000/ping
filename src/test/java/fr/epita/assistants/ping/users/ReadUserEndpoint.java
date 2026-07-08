package fr.epita.assistants.ping.users;

import fr.epita.assistants.ping.testsupport.EndpointTestBase;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.core.Is.is;
@QuarkusTest
public class ReadUserEndpoint extends EndpointTestBase {
    @Test
    void testAdminCanFetchAnyUser(){
        String targetUserId = provisionUser("clark.ken", "superman", false);
        String adminToken = adminBearerToken();
        fetchUser(targetUserId, adminToken).then().statusCode(200).body("id",is(targetUserId)).body("login", is("clark.kent"));
    }
    @Test
    void testRegularUserCanFetchTheirOwnProfile(){
        String myProfileId = provisionUser("bruce.wayne", "batman", false);
        String myToken = loginAs("bruce.wayne", "batman");
        fetchUser(myProfileId, myToken).then().statusCode(200).body("id", is(myProfileId));
    }
    @Test
    void testRegularUserFetchSmeoneElse(){
        String victimId = provisionUser("peter.parker", "spido", false);
        String snooperToken = provisionUserAndLogin("eddie.brock", "venom",false);
        fetchUser(victimId, snooperToken).then().statusCode(403);
    }
    @Test
    void testAnonymousRequestIsRejected(){
        String someUserId = provisionUser("diana.prince", "wonderwomen", false);
        given().get("/api/user/" + someUserId).then().statusCode(401);
    }
    @Test
    void testRandomIdReturnNotFound(){
        String fakeUserId = UUID.randomUUID().toString();
        String adminToken = adminBearerToken();
        fetchUser(fakeUserId, adminToken).then().statusCode(404);
    }
}
