package com.openclassrooms.starterjwt;

import com.fasterxml.jackson.databind.JsonNode;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Named;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.junit.jupiter.api.Named.named;

class SessionWriteIT extends ApiIntegrationSupport {
    private static final String DATE = "2026-12-01T18:30:00Z";

    private String adminToken;

    private User user;

    private Teacher margot;

    private Teacher helene;

    @BeforeEach
    void logInAsAdminAndCreateTheTeachers() {
        this.createUser("admin@test.com", true);
        this.adminToken = this.logIn("admin@test.com");
        this.user = this.createUser("user@test.com", false);
        this.margot = this.createTeacher("Margot", "DELAHAYE");
        this.helene = this.createTeacher("Hélène", "THIERCELIN");
    }

    @Test
    void anAdminCreatesASession() {
        ResponseEntity<JsonNode> response = this.send(HttpMethod.POST, "/api/session", this.adminToken,
                sessionBody("Yoga", this.margot));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode created = response.getBody();
        assertThat(created.get("name").asText()).isEqualTo("Yoga");
        assertThat(OffsetDateTime.parse(created.get("date").asText()).toInstant()).isEqualTo(Instant.parse(DATE));
        assertThat(created.get("description").asText()).isEqualTo("Description of Yoga");
        assertThat(created.get("teacher_id").asLong()).isEqualTo(this.margot.getId());
        assertThat(created.get("users").isArray()).isTrue();
        assertThat(created.get("users")).isEmpty();
        assertThat(created.hasNonNull("createdAt")).isTrue();
        assertThat(this.readSessions()).extracting(session -> session.get("id").asLong())
                .containsExactly(created.get("id").asLong());
    }

    @Test
    void anIdentifierInTheBodyCreatesANewSession() {
        Session stretching = this.createSession("Stretching", this.helene);
        Map<String, Object> body = sessionBody("Yoga", this.margot);
        body.put("id", stretching.getId());

        long createdId = this.send(HttpMethod.POST, "/api/session", this.adminToken, body).getBody().get("id").asLong();

        assertThat(createdId).isNotEqualTo(stretching.getId());
        assertThat(this.readSession(stretching.getId()).get("name").asText()).isEqualTo("Stretching");
    }

    @Test
    void theParticipantsOfTheBodyAreIgnoredAtCreation() {
        Map<String, Object> body = sessionBody("Yoga", this.margot);
        body.put("users", List.of(this.user.getId()));

        long createdId = this.send(HttpMethod.POST, "/api/session", this.adminToken, body).getBody().get("id").asLong();

        assertThat(this.readSession(createdId).get("users")).isEmpty();
    }

    @Test
    void theParticipantsOfTheBodyAreIgnoredAtUpdate() {
        Session yoga = this.createSession("Yoga", this.margot, this.user);
        User other = this.createUser("other@test.com", false);
        Map<String, Object> body = sessionBody("Yoga", this.margot);
        body.put("users", List.of(other.getId()));

        this.send(HttpMethod.PUT, "/api/session/" + yoga.getId(), this.adminToken, body);

        assertThat(this.readSession(yoga.getId()).get("users")).extracting(JsonNode::asLong)
                .containsExactly(this.user.getId());
    }

    @Test
    void creatingASessionWithAnUnknownTeacherIsABadRequest() {
        Map<String, Object> body = sessionBody("Yoga", this.margot);
        body.put("teacher_id", UNKNOWN_ID);

        assertThat(this.send(HttpMethod.POST, "/api/session", this.adminToken, body).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(this.readSessions()).isEmpty();
    }

    @Test
    void updatingASessionWithAnUnknownTeacherIsABadRequest() {
        Session yoga = this.createSession("Yoga", this.margot);
        Map<String, Object> body = sessionBody("Yoga Nidra", this.margot);
        body.put("teacher_id", UNKNOWN_ID);

        assertThat(this.send(HttpMethod.PUT, "/api/session/" + yoga.getId(), this.adminToken, body).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        JsonNode stored = this.readSession(yoga.getId());
        assertThat(stored.get("name").asText()).isEqualTo("Yoga");
        assertThat(stored.get("teacher_id").asLong()).isEqualTo(this.margot.getId());
    }

    @ParameterizedTest
    @MethodSource("invalidChanges")
    void anInvalidSessionIsABadRequest(Consumer<Map<String, Object>> invalidChange) {
        Map<String, Object> body = sessionBody("Yoga", this.margot);
        invalidChange.accept(body);

        assertThat(this.send(HttpMethod.POST, "/api/session", this.adminToken, body).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void aMalformedSessionIsABadRequest() {
        assertThat(this.sendJson(HttpMethod.POST, "/api/session", this.adminToken, "{\"name\":").getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void anInvalidUpdateIsABadRequest() {
        Session yoga = this.createSession("Yoga", this.margot);
        Map<String, Object> body = sessionBody("Yoga", this.margot);
        body.put("name", "");

        assertThat(this.send(HttpMethod.PUT, "/api/session/" + yoga.getId(), this.adminToken, body).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void aTeacherCanLeadSeveralSessions() {
        this.createSession("Stretching", this.margot);

        assertThat(this.send(HttpMethod.POST, "/api/session", this.adminToken, sessionBody("Yoga", this.margot))
                .getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(this.readSessions()).extracting(session -> session.get("teacher_id").asLong())
                .containsExactly(this.margot.getId(), this.margot.getId());
    }

    @Test
    void anAdminUpdatesASession() {
        Session yoga = this.createSession("Yoga", this.margot, this.user);
        String createdAt = this.readSession(yoga.getId()).get("createdAt").asText();

        ResponseEntity<JsonNode> response = this.send(HttpMethod.PUT, "/api/session/" + yoga.getId(),
                this.adminToken, sessionBody("Yoga Nidra", this.helene));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        this.assertIsTheUpdatedSession(response.getBody(), createdAt);
        this.assertIsTheUpdatedSession(this.readSession(yoga.getId()), createdAt);
    }

    @Test
    void updatingAnUnknownSessionIsNotFound() {
        assertThat(this.send(HttpMethod.PUT, "/api/session/" + UNKNOWN_ID, this.adminToken,
                sessionBody("Yoga", this.margot)).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void deletingAnUnknownSessionIsNotFound() {
        assertThat(this.send(HttpMethod.DELETE, "/api/session/" + UNKNOWN_ID, this.adminToken).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void anAdminDeletesASession() {
        Session yoga = this.createSession("Yoga", this.margot);

        assertThat(this.send(HttpMethod.DELETE, "/api/session/" + yoga.getId(), this.adminToken).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        assertThat(this.send(HttpMethod.GET, "/api/session/" + yoga.getId(), this.adminToken).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void aSessionWithParticipantsCanBeDeleted() {
        Session yoga = this.createSession("Yoga", this.margot, this.user);

        assertThat(this.send(HttpMethod.DELETE, "/api/session/" + yoga.getId(), this.adminToken).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        assertThat(this.send(HttpMethod.GET, "/api/session/" + yoga.getId(), this.adminToken).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @ParameterizedTest
    @ValueSource(strings = {"POST", "PUT", "DELETE"})
    void aUserCannotCreateUpdateOrDeleteASession(HttpMethod method) {
        Session yoga = this.createSession("Yoga", this.margot);
        String userToken = this.logIn("user@test.com");
        String url = HttpMethod.POST.equals(method) ? "/api/session" : "/api/session/" + yoga.getId();

        ResponseEntity<JsonNode> response = this.send(method, url, userToken, sessionBody("Yoga Nidra", this.helene));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(this.readSessions())
                .extracting(session -> session.get("id").asLong(), session -> session.get("name").asText(),
                        session -> session.get("teacher_id").asLong())
                .containsExactly(tuple(yoga.getId(), "Yoga", this.margot.getId()));
    }

    // Each change turns a valid body for an existing teacher into an invalid one, so that the 400 can only come from
    // the validation.
    static Stream<Named<Consumer<Map<String, Object>>>> invalidChanges() {
        return Stream.of(
                change("empty name", body -> body.put("name", "")),
                change("name over 50 characters", body -> body.put("name", "Y".repeat(51))),
                change("no date", body -> body.remove("date")),
                change("no teacher", body -> body.remove("teacher_id")),
                change("no description", body -> body.remove("description")),
                change("description over 2500 characters", body -> body.put("description", "D".repeat(2501))),
                change("empty body", Map::clear));
    }

    private static Named<Consumer<Map<String, Object>>> change(String name, Consumer<Map<String, Object>> change) {
        return named(name, change);
    }

    private void assertIsTheUpdatedSession(JsonNode session, String createdAt) {
        assertThat(session.get("name").asText()).isEqualTo("Yoga Nidra");
        assertThat(OffsetDateTime.parse(session.get("date").asText()).toInstant()).isEqualTo(Instant.parse(DATE));
        assertThat(session.get("description").asText()).isEqualTo("Description of Yoga Nidra");
        assertThat(session.get("teacher_id").asLong()).isEqualTo(this.helene.getId());
        assertThat(session.get("users")).extracting(JsonNode::asLong).containsExactly(this.user.getId());
        assertThat(session.get("createdAt").asText()).isEqualTo(createdAt);
    }

    private JsonNode readSessions() {
        return this.send(HttpMethod.GET, "/api/session", this.adminToken).getBody();
    }

    private JsonNode readSession(long id) {
        return this.send(HttpMethod.GET, "/api/session/" + id, this.adminToken).getBody();
    }

    private static Map<String, Object> sessionBody(String name, Teacher teacher) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("date", DATE);
        body.put("teacher_id", teacher.getId());
        body.put("description", "Description of " + name);
        return body;
    }
}
