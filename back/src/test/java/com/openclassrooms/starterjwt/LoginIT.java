package com.openclassrooms.starterjwt;

import com.fasterxml.jackson.databind.JsonNode;
import com.openclassrooms.starterjwt.models.User;
import org.junit.jupiter.api.Named;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Named.named;

class LoginIT extends ApiIntegrationSupport {
    private static final String USER = "user@test.com";

    @Test
    void aSuccessfulLoginReturnsTheAccountAndAToken() {
        User user = this.createUser(USER, false);

        ResponseEntity<JsonNode> response = this.logInWith(USER, PASSWORD);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = response.getBody();
        assertThat(body.get("id").asLong()).isEqualTo(user.getId());
        assertThat(body.get("username").asText()).isEqualTo(USER);
        assertThat(body.get("firstName").asText()).isEqualTo("John");
        assertThat(body.get("lastName").asText()).isEqualTo("Doe");
        assertThat(body.get("type").asText()).isEqualTo("Bearer");
        assertThat(body.get("token").asText()).isNotBlank();
    }

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void theLoginTellsWhetherTheAccountIsAnAdministrator(boolean admin) {
        this.createUser(USER, admin);

        assertThat(this.logInWith(USER, PASSWORD).getBody().get("admin").asBoolean()).isEqualTo(admin);
    }

    @ParameterizedTest
    @CsvSource({
            "user@test.com, wrong-password",
            "unknown@test.com, test!1234"
    })
    void aWrongPasswordOrAnUnknownEmailIsUnauthorized(String email, String password) {
        this.createUser(USER, false);

        assertThat(this.logInWith(email, password).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @ParameterizedTest
    @MethodSource("incompleteLogins")
    void anIncompleteLoginIsABadRequest(Map<String, String> credentials) {
        assertThat(this.send(HttpMethod.POST, "/api/auth/login", null, credentials).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void aMalformedLoginIsABadRequest() {
        assertThat(this.sendJson(HttpMethod.POST, "/api/auth/login", null, "{\"email\":").getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    static Stream<Named<Map<String, String>>> incompleteLogins() {
        return Stream.of(
                named("empty body", Map.of()),
                named("no email", Map.of("password", PASSWORD)),
                named("no password", Map.of("email", USER)),
                named("blank email", Map.of("email", " ", "password", PASSWORD)),
                named("blank password", Map.of("email", USER, "password", " ")));
    }

    private ResponseEntity<JsonNode> logInWith(String email, String password) {
        return this.send(HttpMethod.POST, "/api/auth/login", null, Map.of("email", email, "password", password));
    }
}
