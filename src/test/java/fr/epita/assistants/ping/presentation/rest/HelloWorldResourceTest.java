package fr.epita.assistants.ping.presentation.rest;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

@QuarkusTest
class HelloWorldRessourceTest {
    @Test
    void helloTestOkExpectedMess(){
        given().when().get("/api/hello").then().statusCode(200).contentType(ContentType.TEXT).body(equalTo("Hello World!"));
    }
    @Test
    void errorBadRequestWithJsonMessage(){
        given().when().get("/api/error").then().statusCode(400).contentType(ContentType.JSON).body("message", equalTo("Example error: This is an error"));
    }
}