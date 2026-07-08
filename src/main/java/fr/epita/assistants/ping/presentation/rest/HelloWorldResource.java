package fr.epita.assistants.ping.presentation.rest;

import fr.epita.assistants.ping.utils.Logger;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import static fr.epita.assistants.ping.errors.ErrorsCode.EXAMPLE_ERROR;

@Path("/api")
public class HelloWorldResource {

    @Inject
    Logger logger;

    @GET
    @Path("/hello")
    @Produces(MediaType.TEXT_PLAIN)
    public Response helloWorld() {
        logger.log("GET /api/hello");
        return Response.ok("Hello World!").build();
    }

    @GET
    @Path("/error")
    @Produces(MediaType.APPLICATION_JSON)
    public Response error() {
        logger.error("GET /api/error");
        EXAMPLE_ERROR.throwException("This is an error");
        return Response.noContent().build();
    }

}
