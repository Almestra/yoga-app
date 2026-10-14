package com.openclassrooms.starterjwt;

import com.fasterxml.jackson.databind.JsonNode;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

class SessionReadIT extends ApiIntegrationSupport {
    private User user;

    private String userToken;

    private Teacher margot;

    private Teacher helene;

    @BeforeEach
    void logInAsUserAndCreateTheTeachers() {
        this.user = this.createUser("user@test.com", false);
        this.userToken = this.logIn("user@test.com");
        this.margot = this.createTeacher("Margot", "DELAHAYE");
        this.helene = this.createTeacher("Hélène", "THIERCELIN");
    }

    @Test
    void aLoggedInUserGetsEverySession() {
        Session yoga = this.createSession("Yoga", this.margot, this.user);
        Session stretching = this.createSession("Stretching", this.helene);

        ResponseEntity<JsonNode> response = this.send(HttpMethod.GET, "/api/session", this.userToken);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody())
                .extracting(session -> session.get("id").asLong(), session -> session.get("name").asText(),
                        session -> session.get("teacher_id").asLong())
                .containsExactlyInAnyOrder(
                        tuple(yoga.getId(), "Yoga", this.margot.getId()),
                        tuple(stretching.getId(), "Stretching", this.helene.getId()));
    }

    @Test
    void aLoggedInUserGetsTheDetailsOfASession() {
        User other = this.createUser("other@test.com", false);
        this.createSession("Yoga", this.margot);
        Session stretching = this.createSession("Stretching", this.helene, this.user, other);

        ResponseEntity<JsonNode> response = this.send(HttpMethod.GET, "/api/session/" + stretching.getId(),
                this.userToken);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = response.getBody();
        assertThat(body.get("id").asLong()).isEqualTo(stretching.getId());
        assertThat(body.get("name").asText()).isEqualTo("Stretching");
        assertThat(OffsetDateTime.parse(body.get("date").asText()).toInstant()).isEqualTo(SESSION_DATE.toInstant());
        assertThat(body.get("description").asText()).isEqualTo("Description of Stretching");
        assertThat(body.get("teacher_id").asLong()).isEqualTo(this.helene.getId());
        assertThat(body.get("users")).extracting(JsonNode::asLong)
                .containsExactlyInAnyOrder(this.user.getId(), other.getId());
        assertThat(body.hasNonNull("createdAt")).isTrue();
        assertThat(body.hasNonNull("updatedAt")).isTrue();
    }

    @Test
    void aSessionWithoutParticipantHasAnEmptyList() {
        Session yoga = this.createSession("Yoga", this.margot);

        JsonNode body = this.send(HttpMethod.GET, "/api/session/" + yoga.getId(), this.userToken).getBody();

        assertThat(body.get("users").isArray()).isTrue();
        assertThat(body.get("users")).isEmpty();
    }

    @Test
    void anUnknownSessionIsNotFound() {
        assertThat(this.send(HttpMethod.GET, "/api/session/" + UNKNOWN_ID, this.userToken).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
