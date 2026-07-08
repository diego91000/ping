package fr.epita.assistants.ping.users;

import fr.epita.assistants.ping.testsupport.EndpointTestBase;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.core.Is.is;

@QuarkusTest
class CreateUserTest extends EndpointTestBase {
    private void checkAdminPostStatus(String jsonPayload, int expectedStatusCode) {
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + adminBearerToken()).body(jsonPayload).when().post("/api/user").then().statusCode(expectedStatusCode);
    }

    @Test
    void testCreateWithDotTodoGoodProfile() {
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + adminBearerToken()).body(createUserPayload("luc.ok", "123", false)).when().post("/api/user").then().statusCode(200).body("login", is("luc.ok")).body("displayName", is("Luc Ok")).body("isAdmin", is(false)).body("avatar", is(""));
    }

    @Test
    void testCreateWithunderScoreTodoGoodProfile() {
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + adminBearerToken()).body(createUserPayload("luc_ok", "1234", false)).when().post("/api/user").then().statusCode(200).body("displayName", is("Luc Ok"));
    }

    @Test
    void testCreateWorkers() {
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + adminBearerToken()).body(createUserPayload("super.boss", "admin123", true)).when().post("/api/user").then().statusCode(200).body("isAdmin", is(true));
    }

    @Test
    void testCreateWithNoPassword() {
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + adminBearerToken()).body(createUserPayload("incognito.boss", "ok", false)).when().post("/api/user").then().statusCode(200).body("password", is(nullValue()));
    }

    @Test
    void testLogAfterCreate() {
        checkAdminPostStatus(createUserPayload("ok.ok", "gag", false), 200);
        given().contentType(ContentType.JSON).body(loginPayload("ok.ok", "gag")).when().post("/api/user/login").then().statusCode(200);
    }

    @Test
    void testCreationSameUserTwiceFailWith409() {
        String payload = createUserPayload("fo.fo", "987", false);
        checkAdminPostStatus(payload, 200);
        checkAdminPostStatus(payload, 409);
    }

    @Test
    void testCreateWithoutAuthfails401() {
        given().contentType(ContentType.JSON).body(createUserPayload("hk.m", "kh", false)).when().post("/api/user").then().statusCode(401);
    }

    @Test
    void testCreationByNormalUserFailsWith403() {
        String normaltoken = provisionUserAndLogin("chill.guy", "pwd", false);
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + normaltoken).body(createUserPayload("sneaky.user", "pwd", false)).then().statusCode(403);
    }

    @Test
    void testLoginwithSepa400() {
        checkAdminPostStatus(createUserPayload("_", "pwd", false), 400);
    }

    @Test
    void testLoginSatartWithDot400() {
        checkAdminPostStatus(createUserPayload(".dot", "pwd", false), 400);

    }
    @Test
    void testLoginEndWithDot400() {
        checkAdminPostStatus(createUserPayload("dot.", "pwd", false), 400);

    }
    @Test
    void testLoginDotplusunderscore400() {
        checkAdminPostStatus(createUserPayload("dot_under.", "pwd", false), 400);

    }
    @Test
    void testLoginManyDot400() {
        checkAdminPostStatus(createUserPayload(".dot.dot.dot.dot", "pwd", false), 400);

    }
    @Test
    void testEmptyPass400() {
        checkAdminPostStatus(createUserPayload(".dot", "", false), 400);

    }
    @Test
    void testEmptyLog400() {
        checkAdminPostStatus(createUserPayload("", "pwd", false), 400);

    }


}

