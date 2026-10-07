package com.openclassrooms.starterjwt.exception;

import com.openclassrooms.starterjwt.payload.response.MessageResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Maps the exceptions thrown while handling a request to their HTTP status.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Void> handleNotFound() {
        return ResponseEntity.notFound().build();
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Void> handleBadRequest() {
        return ResponseEntity.badRequest().build();
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Void> handleTypeMismatch() {
        return ResponseEntity.badRequest().build();
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Void> handleUnauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @ExceptionHandler(EmailAlreadyTakenException.class)
    public ResponseEntity<MessageResponse> handleEmailAlreadyTaken() {
        return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already taken!"));
    }
}
