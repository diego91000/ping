package fr.epita.assistants.ping.presentation.rest;

import fr.epita.assistants.ping.domain.service.authentification.AuthService;
import fr.epita.assistants.ping.domain.service.file.FileService;
import fr.epita.assistants.ping.errors.ErrorsCode;
import fr.epita.assistants.ping.presentation.api.request.filesystem.MoveRequest;
import fr.epita.assistants.ping.presentation.api.request.filesystem.PathRequest;
import fr.epita.assistants.ping.utils.Logger;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/files")
public class FileResource {

    @Inject
    FileService fileService;

    @Inject
    AuthService authService;

    @Inject
    Logger logger;

    @GET
    @Authenticated
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    public Response read(@QueryParam("path") String path) {
        logger.log("GET /api/files path=" + path + " user=" + authService.currentUserId());
        try {
            byte[] content = fileService.read(path);
            return Response.ok(content).build();
        } catch (RuntimeException e) {
            logger.error("GET /api/files path=" + path + " user=" + authService.currentUserId());
            throw e;
        }
    }

    @GET
    @Path("/all")
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    public Response listAll(@QueryParam("path") String path) {
        logger.log("GET /api/files/all path=" + path + " user=" + authService.currentUserId());
        try {
            return Response.ok(fileService.listAll(path)).build();
        } catch (RuntimeException e) {
            logger.error("GET /api/files/all path=" + path + " user=" + authService.currentUserId());
            throw e;
        }
    }

    @GET
    @Path("/db")
    @Authenticated
    @Produces(MediaType.TEXT_PLAIN)
    public Response readFromDb(@QueryParam("path") String path) {
        logger.log("GET /api/files/db path=" + path + " user=" + authService.currentUserId());
        try {
            return Response.ok(fileService.readFromDb(path)).build();
        } catch (RuntimeException e) {
            logger.error("GET /api/files/db path=" + path + " user=" + authService.currentUserId());
            throw e;
        }
    }

    @POST
    @Authenticated
    @Consumes(MediaType.APPLICATION_JSON)
    public Response create(PathRequest request) {
        if (request == null) {
            ErrorsCode.EMPTY_REQUEST.throwException();
        }
        logger.log("POST /api/files path=" + request.relativePath + " user=" + authService.currentUserId());
        try {
            fileService.create(request.relativePath);
            return Response.status(Response.Status.CREATED).build();
        } catch (RuntimeException e) {
            logger.error("POST /api/files path=" + request.relativePath + " user=" + authService.currentUserId());
            throw e;
        }
    }

    @DELETE
    @Authenticated
    @Consumes(MediaType.APPLICATION_JSON)
    public Response delete(PathRequest request) {
        if (request == null) {
            ErrorsCode.EMPTY_REQUEST.throwException();
        }
        logger.log("DELETE /api/files path=" + request.relativePath + " user=" + authService.currentUserId());
        try {
            fileService.delete(request.relativePath);
            return Response.noContent().build();
        } catch (RuntimeException e) {
            logger.error("DELETE /api/files path=" + request.relativePath + " user=" + authService.currentUserId());
            throw e;
        }
    }

    @POST
    @Path("/upload")
    @Authenticated
    @Consumes(MediaType.APPLICATION_OCTET_STREAM)
    public Response upload(@QueryParam("path") String path, byte[] body) {
        logger.log("POST /api/files/upload path=" + path + " user=" + authService.currentUserId());
        try {
            fileService.upload(path, body);
            return Response.status(Response.Status.CREATED).build();
        } catch (RuntimeException e) {
            logger.error("POST /api/files/upload path=" + path + " user=" + authService.currentUserId());
            throw e;
        }
    }

    @PUT
    @Path("/move")
    @Authenticated
    @Consumes(MediaType.APPLICATION_JSON)
    public Response move(MoveRequest request) {
        if (request == null) {
            ErrorsCode.EMPTY_REQUEST.throwException();
        }
        logger.log("PUT /api/files/move src=" + request.src + " dst=" + request.dst + " user=" + authService.currentUserId());
        try {
            fileService.move(request.src, request.dst);
            return Response.noContent().build();
        } catch (RuntimeException e) {
            logger.error("PUT /api/files/move src=" + request.src + " dst=" + request.dst + " user=" + authService.currentUserId());
            throw e;
        }
    }
}
