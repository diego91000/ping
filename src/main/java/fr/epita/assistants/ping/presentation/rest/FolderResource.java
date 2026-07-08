package fr.epita.assistants.ping.presentation.rest;

import fr.epita.assistants.ping.domain.service.authentification.AuthService;
import fr.epita.assistants.ping.domain.service.folder.FolderService;
import fr.epita.assistants.ping.errors.ErrorsCode;
import fr.epita.assistants.ping.presentation.api.request.filesystem.MoveRequest;
import fr.epita.assistants.ping.presentation.api.request.filesystem.PathRequest;
import fr.epita.assistants.ping.presentation.api.response.filesystem.FSEntryResponse;
import fr.epita.assistants.ping.utils.Logger;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/folders")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class FolderResource {
    @Inject
    FolderService folderService;
    @Inject
    AuthService authService;

    @Inject
    Logger logger;

    @GET
    @Authenticated
    public Response listFolder(@QueryParam("path") String path) {
        logger.log("GET /api/folders path=" + path + " user="
                + authService.currentUserId());
        try {
            List<FSEntryResponse> entries = folderService.list(path);
            return Response.ok(entries).build();
        } catch (RuntimeException e) {
            logger.error("GET /api/folders path=" + path + " user="
                    + authService.currentUserId());
            throw e;
        }
    }

    @POST
    @Authenticated
    public Response createFolder(PathRequest request) {
        if (request == null) {
            ErrorsCode.EMPTY_REQUEST.throwException();
        }

        logger.log("POST /api/folders relativePath=" + request.relativePath +
                " user=" + authService.currentUserId());
        try {
            folderService.create(request.relativePath);
            return Response.status(Response.Status.CREATED).build();
        } catch (RuntimeException e) {
            logger.error("POST /api/folders relativePath=" + request.relativePath +
                    " user=" + authService.currentUserId());
            throw e;
        }
    }

    @DELETE
    @Authenticated
    public Response deleteFolder(PathRequest request) {
        if (request == null) {
            ErrorsCode.EMPTY_REQUEST.throwException();
        }

        logger.log("DELETE /api/folders relativePath=" + request.relativePath +
                " user=" + authService.currentUserId());
        try {
            folderService.delete(request.relativePath);
            return Response.noContent().build();
        } catch (RuntimeException e) {
            logger.error("DELETE /api/folders relativePath=" + request.relativePath +
                    " user=" + authService.currentUserId());
            throw e;
        }
    }

    @PUT
    @Path("/move")
    @Authenticated
    public Response updateFolder(MoveRequest request) {
        if (request == null) {
            ErrorsCode.EMPTY_REQUEST.throwException();
        }
        logger.log("PUT /api/folders/move src=" + request.src + " dst=" +
                request.dst + " user=" + authService.currentUserId());
        try {
            folderService.move(request.src, request.dst);
            return Response.noContent().build();
        } catch (RuntimeException e) {
            logger.error("PUT /api/folders/move src=" + request.src + " dst=" +
                    request.dst + " user=" + authService.currentUserId());
            throw e;
        }
    }
}
