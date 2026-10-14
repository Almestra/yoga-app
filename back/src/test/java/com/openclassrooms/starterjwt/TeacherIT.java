package com.openclassrooms.starterjwt;

import com.fasterxml.jackson.databind.JsonNode;
import com.openclassrooms.starterjwt.models.Teacher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

class TeacherIT extends ApiIntegrationSupport {
    private String userToken;

    @BeforeEach
    void logInAsUser() {
        this.createUser("user@test.com", false);
        this.userToken = this.logIn("user@test.com");
    }

    @Test
    void aLoggedInUserGetsEveryTeacher() {
        Teacher margot = this.createTeacher("Margot", "DELAHAYE");
        Teacher helene = this.createTeacher("Hélène", "THIERCELIN");

        ResponseEntity<JsonNode> response = this.send(HttpMethod.GET, "/api/teacher", this.userToken);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody())
                .extracting(teacher -> teacher.get("id").asLong(), teacher -> teacher.get("firstName").asText(),
                        teacher -> teacher.get("lastName").asText())
                .containsExactlyInAnyOrder(
                        tuple(margot.getId(), "Margot", "DELAHAYE"),
                        tuple(helene.getId(), "Hélène", "THIERCELIN"));
    }

    @Test
    void aLoggedInUserGetsATeacherByItsId() {
        this.createTeacher("Margot", "DELAHAYE");
        Teacher helene = this.createTeacher("Hélène", "THIERCELIN");

        ResponseEntity<JsonNode> response = this.send(HttpMethod.GET, "/api/teacher/" + helene.getId(), this.userToken);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("id").asLong()).isEqualTo(helene.getId());
        assertThat(response.getBody().get("firstName").asText()).isEqualTo("Hélène");
        assertThat(response.getBody().get("lastName").asText()).isEqualTo("THIERCELIN");
    }

    @Test
    void anUnknownTeacherIsNotFound() {
        assertThat(this.send(HttpMethod.GET, "/api/teacher/" + UNKNOWN_ID, this.userToken).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
