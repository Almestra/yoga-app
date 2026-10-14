package com.openclassrooms.starterjwt;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;

class RequestErrorsIT extends ApiIntegrationSupport {
    private String adminToken;

    @BeforeEach
    void logInAsAdmin() {
        this.createUser("admin@test.com", true);
        this.adminToken = this.logIn("admin@test.com");
    }

    @ParameterizedTest
    @CsvSource({
            "GET, /api/session/abc",
            "PUT, /api/session/abc",
            "DELETE, /api/session/abc",
            "POST, /api/session/abc/participate/1",
            "POST, /api/session/1/participate/abc",
            "DELETE, /api/session/abc/participate/1",
            "DELETE, /api/session/1/participate/abc",
            "GET, /api/teacher/abc",
            "GET, /api/user/abc",
            "DELETE, /api/user/abc"
    })
    void aNonNumericIdentifierIsABadRequest(HttpMethod method, String url) {
        assertThat(this.send(method, url, this.adminToken).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void anUnknownAddressIsNotFound() {
        assertThat(this.send(HttpMethod.GET, "/api/unknown", this.adminToken).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void anUnsupportedMethodIsNotAllowed() {
        assertThat(this.send(HttpMethod.DELETE, "/api/teacher/1", this.adminToken).getStatusCode())
                .isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
    }
}
