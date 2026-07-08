package fr.epita.assistants.ping.presentation.rest;

import fr.epita.assistants.ping.converter.UserConverter;
import fr.epita.assistants.ping.data.model.UserModel;
import fr.epita.assistants.ping.domain.service.authentification.AuthService;
import fr.epita.assistants.ping.domain.service.user.UserService;
import fr.epita.assistants.ping.errors.ErrorsCode;
import fr.epita.assistants.ping.presentation.api.request.user.LoginRequest;
import fr.epita.assistants.ping.presentation.api.request.user.NewUserRequest;
import fr.epita.assistants.ping.presentation.api.request.user.UpdateUserRequest;
import fr.epita.assistants.ping.utils.JwtUtils;
import fr.epita.assistants.ping.utils.Logger;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/api/user")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class UserResource {
    @Inject
    UserService userService;

    @Inject
    JwtUtils jwtUtils;

    @Inject
    AuthService authService;

    @Inject
    Logger logger;

    @POST
    @RolesAllowed("admin")
    public Response createUser(NewUserRequest request) {
        if (request == null) {
            logger.error("POST /api/user request=null user=" +
                    authService.currentUserId());
            ErrorsCode.EMPTY_REQUEST.throwException();
        }
        logger.log("POST /api/user login=" + request.login
                + " password=(hidden) isAdmin=" + request.isAdmin + " user="
                + authService.currentUserId());

        try {
            UserModel user = userService.create(
                    request.login,
                    request.password,
                    request.isAdmin
            );
            return Response.ok(UserConverter.toUserResponse(user)).build();
        } catch (RuntimeException e) {
            logger.error("POST /api/user login=" + request.login
                    + " password=(hizen) isAdmin=" + request.isAdmin + " user="
                    + authService.currentUserId());
            throw e;
        }
    }

    @POST
    @Path("/login")
    public Response login(LoginRequest request) {
        if (request == null) {
            logger.error("POST /api/user/login request=null user=anonymous");
            ErrorsCode.EMPTY_REQUEST.throwException();
        }
        logger.log("POST /api/user/login login=" + request.login
                + " password=(hidden) user=anonymous");

        try {
            UserModel user = userService.login(request.login, request.password);
            String token = jwtUtils.generateToken(user);

            logger.log("POST /api/user/login login=" + request.login
                    + " password=(hidden) user=" + user.getId());

            return Response.ok(UserConverter.toLoginResponse(token)).build();
        } catch (RuntimeException e) {
            logger.error("POST /api/user/login login=" + request.login + " password=(hizen) user=anonimous");
            throw e;
        }
    }

    @GET
    @Path("/all")
    @RolesAllowed("admin")
    public Response getAllUsers() {
        logger.log("GET /api/user/all user=" + authService.currentUserId());

        try {
            List<UserModel> users = userService.getAll();
            return Response.ok(UserConverter.toUserResponses(users)).build();
        } catch (RuntimeException e) {
            logger.error("GET /api/user/all user=" + authService.currentUserId());
            throw e;
        }
    }

    @GET
    @Path("/refresh")
    @Authenticated
    public Response refresh() {
        logger.log("GET /api/user/refresh user=" + authService.currentUserId());

        try {
            UserModel user = userService.getById(authService.currentUserId());
            String token = jwtUtils.generateToken(user);
            return Response.ok(UserConverter.toLoginResponse(token)).build();
        } catch (RuntimeException e) {
            logger.error("GET /api/user/refresh user=" + authService.currentUserId());
            throw e;
        }
    }

    @GET
    @Path("/{id}")
    @Authenticated
    public Response getById(@PathParam("id") UUID id) {
        logger.log("GET /api/user/" + id + " id=" + id +
                " user=" + authService.currentUserId());

        UserModel user;
        try {
            user = userService.getById(id);
        } catch (RuntimeException e) {
            logger.error("GET /api/user/" + id + " id=" + id +
                    " user=" + authService.currentUserId());
            throw e;
        }

        if (!authService.canAccess(id)) {
            logger.error("GET /api/user/" + id + " forbidden id=" + id + " user=" + authService.currentUserId());

            ErrorsCode.USER_NOT_ALLOWED.throwException();
        }
        return Response.ok(UserConverter.toUserResponse(user)).build();
    }

    @PUT
    @Path("/{id}")
    @Authenticated
    public Response update(@PathParam("id") UUID id,
                           UpdateUserRequest request) {
        if (request == null) {
            logger.error("PUT /api/user/" + id + " request=null user=" +
                    authService.currentUserId());
            ErrorsCode.EMPTY_REQUEST.throwException();
        }

        logger.log("PUT /api/user/" + id + " id=" + id + " password=(hidden) " +
                "displayName=" + request.displayName + " avatar=(hiden)"
                + " user=" + authService.currentUserId());
        if (!authService.canAccess(id)) {
            logger.error("PUT /api/user/" + id + " forbidden id=" + id +
                    " user=" + authService.currentUserId());

            ErrorsCode.USER_NOT_ALLOWED.throwException();
        }

        try {
            UserModel user = userService.update(id, request.password,
                    request.displayName, request.avatar);
            return Response.ok(UserConverter.toUserResponse(user)).build();
        } catch (RuntimeException e) {
            logger.error("PUT /api/user/" + id + " id=" + id + " password=(hidden) " +
                    "displayName=" + request.displayName + " avatar=(hiden)"
                    + " user=" + authService.currentUserId());
            throw e;
        }
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed("admin")
    public Response delete(@PathParam("id") UUID id) {
        logger.log("DELETE /api/user/" + id + " id=" + id +
                " user=" + authService.currentUserId());

        try {
            userService.delete(id);
            return Response.noContent().build();
        } catch (RuntimeException e) {
            logger.error("DELETE /api/user/" + id + " id=" + id +
                    " user=" + authService.currentUserId());
            throw e;
        }
    }
}
