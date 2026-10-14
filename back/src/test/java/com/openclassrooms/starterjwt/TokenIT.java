package com.openclassrooms.starterjwt;

import com.openclassrooms.starterjwt.models.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;

class TokenIT extends ApiIntegrationSupport {
    private static final String USER = "user@test.com";

    private static final String ADMIN = "admin@test.com";

    @Test
    void aValidTokenOpensTheProtectedRoutes() {
        this.createUser(USER, false);
        String token = this.logIn(USER);

        assertThat(this.send(HttpMethod.GET, "/api/session", token).getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @ParameterizedTest
    @CsvSource({
            "GET, /api/session",
            "GET, /api/session/1",
            "POST, /api/session",
            "PUT, /api/session/1",
            "DELETE, /api/session/1",
            "POST, /api/session/1/participate/1",
            "DELETE, /api/session/1/participate/1",
            "GET, /api/teacher",
            "GET, /api/teacher/1",
            "GET, /api/user/1",
            "DELETE, /api/user/1"
    })
    void aRequestWithoutTokenIsRefused(HttpMethod method, String url) {
        assertThat(this.send(method, url, null).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void aTokenWhoseContentWasReplacedIsRefused() {
        this.createUser(USER, false);
        this.createUser(ADMIN, true);
        String[] userToken = this.logIn(USER).split("\\.");
        String[] adminToken = this.logIn(ADMIN).split("\\.");
        String forged = userToken[0] + "." + adminToken[1] + "." + userToken[2];

        assertThat(this.send(HttpMethod.GET, "/api/session", forged).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void aStringThatIsNotATokenIsRefused() {
        assertThat(this.sendWithAuthorization(HttpMethod.GET, "/api/session", "Bearer not-a-token").getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void anEmptyBearerIsRefused() {
        assertThat(this.sendWithAuthorization(HttpMethod.GET, "/api/session", "Bearer ").getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void aTokenWithoutTheBearerSchemeIsRefused() {
        this.createUser(USER, false);
        String token = this.logIn(USER);

        assertThat(this.sendWithAuthorization(HttpMethod.GET, "/api/session", token).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void theTokenOfADeletedAccountIsRefused() {
        User user = this.createUser(USER, false);
        String token = this.logIn(USER);
        this.userRepository.delete(user);

        assertThat(this.send(HttpMethod.GET, "/api/session", token).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
