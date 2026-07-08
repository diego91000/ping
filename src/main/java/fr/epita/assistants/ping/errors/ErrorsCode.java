package fr.epita.assistants.ping.errors;

import fr.epita.assistants.ping.utils.HttpError;
import fr.epita.assistants.ping.utils.IHttpError;
import jakarta.ws.rs.core.Response.Status;
import lombok.Getter;

import static jakarta.ws.rs.core.Response.Status.*;


@Getter
public enum ErrorsCode implements IHttpError {
    EMPTY_REQUEST(BAD_REQUEST, "Empty request"),
    INVALID_LOGIN_OR_PASSWORD(BAD_REQUEST, "Invalid login or password"),
    NULL_LOGIN_OR_PASSWORD(BAD_REQUEST, "The login or the password " +
            "is null"),

    USER_NOT_FOUND(NOT_FOUND, "The user could not be found"),
    USER_NOT_ALLOWED(FORBIDDEN, "The user is not allowed"),

    INVALID_CREDENTIALS(UNAUTHORIZED, "The login/password " +
            "combination is invalid"),
    LOGIN_ALREADY_TAKEN(CONFLICT, "The login is already taken"),

    INVALID_PATH(BAD_REQUEST, "The relative path is invalid"),
    PATH_FORBIDDEN(FORBIDDEN, "The user is not allowed to access " +
            "this path or a path traversal attack was detected"),
    FILE_NOT_FOUND(NOT_FOUND, "The file could not be found"),
    FILE_ALREADY_EXISTS(CONFLICT, "The file already exists"),

    INVALID_MOVE_PATH(BAD_REQUEST, "Invalid source or destination " +
            "path"),

    FOLDER_NOT_FOUND(NOT_FOUND, "The folder could not be found"),
    SOURCE_FOLDER_NOT_FOUND(NOT_FOUND, "The source folder could not " +
            "be found"),
    FILESYSTEM_NOT_FOUND(NOT_FOUND, "The filesystem could not be " +
            "found"),
    FOLDER_ALREADY_EXISTS(CONFLICT, "The folder already exists"),
    DESTINATION_ALREADY_EXISTS(CONFLICT, "The destination already " +
            "exists"),

    INTERNAL_ERROR(INTERNAL_SERVER_ERROR, "Internal server error"),

    EXAMPLE_ERROR(BAD_REQUEST, "Example error: %s"),
    ;

    private final HttpError error;

    ErrorsCode(Status status, String message) {
        error = new HttpError(status, message);
    }

    @Override
    public RuntimeException get(Object... args) {
        return error.get(args);
    }

    @Override
    public void throwException(Object... args) {
        throw error.get(args);
    }
}
