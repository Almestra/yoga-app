package com.openclassrooms.starterjwt;

import com.fasterxml.jackson.databind.JsonNode;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.stream.StreamSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ParticipationIT extends ApiIntegrationSupport {
    private User user;

    private String userToken;

    private User other;

    private String adminToken;

    private Teacher margot;

    @BeforeEach
    void logInAndCreateTheTeacher() {
        this.user = this.createUser("user@test.com", false);
        this.userToken = this.logIn("user@test.com");
        this.other = this.createUser("other@test.com", false);
        this.createUser("admin@test.com", true);
        this.adminToken = this.logIn("admin@test.com");
        this.margot = this.createTeacher("Margot", "DELAHAYE");
    }

    @Test
    void aUserEnrolsInASession() {
        Session yoga = this.createSession("Yoga", this.margot);

        assertThat(this.participation(HttpMethod.POST, yoga.getId(), this.user.getId(), this.userToken)
                .getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(this.participants(yoga)).containsExactly(this.user.getId());
    }

    @Test
    void enrollingTwiceIsABadRequest() {
        Session yoga = this.createSession("Yoga", this.margot, this.user);

        assertThat(this.participation(HttpMethod.POST, yoga.getId(), this.user.getId(), this.userToken)
                .getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(this.participants(yoga)).containsExactly(this.user.getId());
    }

    @Test
    void enrollingInAnUnknownSessionIsNotFound() {
        assertThat(this.participation(HttpMethod.POST, UNKNOWN_ID, this.user.getId(), this.userToken)
                .getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void enrollingAnUnknownUserIsNotFound() {
        Session yoga = this.createSession("Yoga", this.margot);

        assertThat(this.participation(HttpMethod.POST, yoga.getId(), UNKNOWN_ID, this.adminToken).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(this.participants(yoga)).isEmpty();
    }

    @Test
    void aUserWithdrawsFromASession() {
        Session yoga = this.createSession("Yoga", this.margot, this.user, this.other);

        assertThat(this.participation(HttpMethod.DELETE, yoga.getId(), this.user.getId(), this.userToken)
                .getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(this.participants(yoga)).containsExactly(this.other.getId());
    }

    @Test
    void withdrawingWithoutBeingEnrolledIsABadRequest() {
        Session yoga = this.createSession("Yoga", this.margot, this.other);

        assertThat(this.participation(HttpMethod.DELETE, yoga.getId(), this.user.getId(), this.userToken)
                .getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(this.participants(yoga)).containsExactly(this.other.getId());
    }

    @Test
    void withdrawingFromAnUnknownSessionIsNotFound() {
        assertThat(this.participation(HttpMethod.DELETE, UNKNOWN_ID, this.user.getId(), this.userToken)
                .getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void aUserCannotEnrolSomeoneElse() {
        Session yoga = this.createSession("Yoga", this.margot);

        assertThat(this.participation(HttpMethod.POST, yoga.getId(), this.other.getId(), this.userToken)
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(this.participants(yoga)).isEmpty();
    }

    @Test
    void aUserCannotWithdrawSomeoneElse() {
        Session yoga = this.createSession("Yoga", this.margot, this.other);

        assertThat(this.participation(HttpMethod.DELETE, yoga.getId(), this.other.getId(), this.userToken)
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(this.participants(yoga)).containsExactly(this.other.getId());
    }

    @Test
    void anAdminEnrolsSomeoneElse() {
        Session yoga = this.createSession("Yoga", this.margot);

        assertThat(this.participation(HttpMethod.POST, yoga.getId(), this.user.getId(), this.adminToken)
                .getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(this.participants(yoga)).containsExactly(this.user.getId());
    }

    @Test
    void anAdminWithdrawsSomeoneElse() {
        Session yoga = this.createSession("Yoga", this.margot, this.user);

        assertThat(this.participation(HttpMethod.DELETE, yoga.getId(), this.user.getId(), this.adminToken)
                .getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(this.participants(yoga)).isEmpty();
    }

    // No request of the API can enrol someone twice any more: the database is reached through the repository.
    @Test
    void theDatabaseRefusesADuplicateEnrolment() {
        Session yoga = this.createSession("Yoga", this.margot, this.user);
        Session stored = this.sessionRepository.findById(yoga.getId()).orElseThrow();
        stored.getUsers().add(this.user);

        assertThatThrownBy(() -> this.sessionRepository.save(stored))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThat(this.participants(yoga)).containsExactly(this.user.getId());
    }

    private ResponseEntity<JsonNode> participation(HttpMethod method, long sessionId, long userId, String token) {
        return this.send(method, "/api/session/" + sessionId + "/participate/" + userId, token);
    }

    private List<Long> participants(Session session) {
        JsonNode users = this.send(HttpMethod.GET, "/api/session/" + session.getId(), this.adminToken).getBody()
                .get("users");
        return StreamSupport.stream(users.spliterator(), false).map(JsonNode::asLong).toList();
    }
}
