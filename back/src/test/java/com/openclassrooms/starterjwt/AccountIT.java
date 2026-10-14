package com.openclassrooms.starterjwt;

import com.fasterxml.jackson.databind.JsonNode;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AccountIT extends ApiIntegrationSupport {
    private User user;

    private String userToken;

    private User other;

    private String adminToken;

    @BeforeEach
    void logIn() {
        this.user = this.createUser("user@test.com", false);
        this.userToken = this.logIn("user@test.com");
        this.other = this.createUser("other@test.com", false);
        this.createUser("admin@test.com", true);
        this.adminToken = this.logIn("admin@test.com");
    }

    @Test
    void aUserReadsTheirOwnRecordWithoutThePassword() {
        ResponseEntity<JsonNode> response = this.send(HttpMethod.GET, "/api/user/" + this.user.getId(),
                this.userToken);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = response.getBody();
        assertThat(body.get("id").asLong()).isEqualTo(this.user.getId());
        assertThat(body.get("email").asText()).isEqualTo("user@test.com");
        assertThat(body.get("firstName").asText()).isEqualTo("John");
        assertThat(body.get("lastName").asText()).isEqualTo("Doe");
        assertThat(body.get("admin").asBoolean()).isFalse();
        assertThat(body.hasNonNull("createdAt")).isTrue();
        assertThat(body.hasNonNull("updatedAt")).isTrue();
        assertThat(body.has("password")).isFalse();
    }

    @Test
    void anAdminReadsSomeoneElsesRecord() {
        ResponseEntity<JsonNode> response = this.send(HttpMethod.GET, "/api/user/" + this.user.getId(),
                this.adminToken);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("email").asText()).isEqualTo("user@test.com");
    }

    @Test
    void anUnknownRecordIsNotFoundForAnAdmin() {
        assertThat(this.send(HttpMethod.GET, "/api/user/" + UNKNOWN_ID, this.adminToken).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void aUserCannotReadSomeoneElsesRecord() {
        assertThat(this.send(HttpMethod.GET, "/api/user/" + this.other.getId(), this.userToken).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void aUserCannotReadAnUnknownRecord() {
        assertThat(this.send(HttpMethod.GET, "/api/user/" + UNKNOWN_ID, this.userToken).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void aUserDeletesTheirAccountAndCanNoLongerLogIn() {
        assertThat(this.send(HttpMethod.DELETE, "/api/user/" + this.user.getId(), this.userToken).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        assertThat(this.logInStatus("user@test.com")).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void anEnrolledAccountLeavesItsSessionsWhenDeleted() {
        Session yoga = this.createSession("Yoga", this.createTeacher("Margot", "DELAHAYE"), this.user, this.other);

        assertThat(this.send(HttpMethod.DELETE, "/api/user/" + this.user.getId(), this.userToken).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        assertThat(this.send(HttpMethod.GET, "/api/session/" + yoga.getId(), this.adminToken).getBody().get("users"))
                .extracting(JsonNode::asLong).containsExactly(this.other.getId());
    }

    @Test
    void aUserCannotDeleteSomeoneElsesAccount() {
        assertThat(this.send(HttpMethod.DELETE, "/api/user/" + this.other.getId(), this.userToken).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(this.logInStatus("other@test.com")).isEqualTo(HttpStatus.OK);
    }

    @Test
    void anAdminCannotDeleteSomeoneElsesAccount() {
        assertThat(this.send(HttpMethod.DELETE, "/api/user/" + this.user.getId(), this.adminToken).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(this.logInStatus("user@test.com")).isEqualTo(HttpStatus.OK);
    }

    @Test
    void deletingAnUnknownAccountIsForbidden() {
        assertThat(this.send(HttpMethod.DELETE, "/api/user/" + UNKNOWN_ID, this.userToken).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    private HttpStatusCode logInStatus(String email) {
        return this.send(HttpMethod.POST, "/api/auth/login", null, Map.of("email", email, "password", PASSWORD))
                .getStatusCode();
    }
}
