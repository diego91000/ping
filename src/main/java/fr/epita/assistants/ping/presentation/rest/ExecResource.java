package fr.epita.assistants.ping.presentation.rest;

import fr.epita.assistants.ping.domain.service.authentification.AuthService;
import fr.epita.assistants.ping.domain.service.exec.ExecutionService;
import fr.epita.assistants.ping.errors.ErrorsCode;
import fr.epita.assistants.ping.presentation.api.request.filesystem.PathRequest;
import fr.epita.assistants.ping.presentation.api.response.filesystem.ExecResponse;
import fr.epita.assistants.ping.utils.Logger;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/exec")
public class ExecResource {

    @Inject
    ExecutionService executionService;

    @Inject
    AuthService authService;

    @Inject
    Logger logger;

    @POST
    @Authenticated
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response exec(PathRequest request) {
        if (request == null) {
            ErrorsCode.EMPTY_REQUEST.throwException();
        }
        logger.log("POST /api/exec path=" + request.relativePath + " user=" + authService.currentUserId());
        try {
            ExecResponse result = executionService.run(request.relativePath);
            return Response.ok(result).build();
        } catch (RuntimeException e) {
            logger.error("POST /api/exec path=" + request.relativePath + " user=" + authService.currentUserId());
            throw e;
        }
    }
}
