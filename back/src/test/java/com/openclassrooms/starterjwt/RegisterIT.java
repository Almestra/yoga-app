package com.openclassrooms.starterjwt;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Named;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Named.named;

class RegisterIT extends ApiIntegrationSupport {
    private static final String EMAIL = "new@test.com";

    @Test
    void aRegistrationAnswersWithASuccessMessage() {
        ResponseEntity<JsonNode> response = this.register(registration());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("message").asText()).isEqualTo("User registered successfully!");
    }

    @Test
    void aRegisteredAccountCanLogIn() {
        this.register(registration());

        assertThat(this.logInWith(PASSWORD).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void aRegistrationCannotCreateAnAdministrator() {
        this.register(with("admin", true));

        assertThat(this.logInWith(PASSWORD).getBody().get("admin").asBoolean()).isFalse();
    }

    @Test
    void thePasswordIsNotStoredInClear() {
        this.register(registration());

        String stored = this.userRepository.findByEmail(EMAIL).orElseThrow().getPassword();
        assertThat(stored).isNotEqualTo(PASSWORD);
        assertThat(this.passwordEncoder.matches(PASSWORD, stored)).isTrue();
    }

    @Test
    void anEmailAlreadyUsedIsRefused() {
        this.createUser(EMAIL, false);

        ResponseEntity<JsonNode> response = this.register(with("password", "other-password"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().get("message").asText()).isEqualTo("Error: Email is already taken!");
        assertThat(this.logInWith("other-password").getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @ParameterizedTest
    @MethodSource("invalidRegistrations")
    void anInvalidRegistrationIsABadRequest(Map<String, Object> body) {
        assertThat(this.register(body).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void aMalformedRegistrationIsABadRequest() {
        assertThat(this.sendJson(HttpMethod.POST, "/api/auth/register", null, "{\"email\":").getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    static Stream<Named<Map<String, Object>>> invalidRegistrations() {
        return Stream.of(
                named("malformed email", with("email", "not-an-email")),
                named("email over 50 characters", with("email", "a".repeat(42) + "@test.com")),
                named("first name under 3 characters", with("firstName", "Jo")),
                named("first name over 20 characters", with("firstName", "J".repeat(21))),
                named("last name under 3 characters", with("lastName", "Do")),
                named("last name over 20 characters", with("lastName", "D".repeat(21))),
                named("password under 6 characters", with("password", "12345")),
                named("password over 40 characters", with("password", "p".repeat(41))),
                named("no email", without("email")),
                named("no first name", without("firstName")),
                named("no last name", without("lastName")),
                named("no password", without("password")),
                named("empty body", Map.of()));
    }

    private static Map<String, Object> registration() {
        Map<String, Object> body = new HashMap<>();
        body.put("email", EMAIL);
        body.put("firstName", "John");
        body.put("lastName", "Doe");
        body.put("password", PASSWORD);
        return body;
    }

    private static Map<String, Object> with(String field, Object value) {
        Map<String, Object> body = registration();
        body.put(field, value);
        return body;
    }

    private static Map<String, Object> without(String field) {
        Map<String, Object> body = registration();
        body.remove(field);
        return body;
    }

    private ResponseEntity<JsonNode> register(Map<String, Object> body) {
        return this.send(HttpMethod.POST, "/api/auth/register", null, body);
    }

    private ResponseEntity<JsonNode> logInWith(String password) {
        return this.send(HttpMethod.POST, "/api/auth/login", null, Map.of("email", EMAIL, "password", password));
    }
}
