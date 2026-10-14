package com.openclassrooms.starterjwt;

import com.fasterxml.jackson.databind.JsonNode;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.SessionRepository;
import com.openclassrooms.starterjwt.repository.TeacherRepository;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;

/**
 * Starts the application on a random port against the MySQL container, empties the database before each test and sends
 * real HTTP requests to it.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
public abstract class ApiIntegrationSupport {
    protected static final String PASSWORD = "test!1234";

    @Autowired
    protected TestRestTemplate rest;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected TeacherRepository teacherRepository;

    @Autowired
    protected SessionRepository sessionRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @BeforeEach
    void emptyTheDatabase() {
        this.sessionRepository.deleteAll();
        this.userRepository.deleteAll();
        this.teacherRepository.deleteAll();
    }

    protected User createUser(String email, boolean admin) {
        return this.userRepository.save(new User(email, "Doe", "John", this.passwordEncoder.encode(PASSWORD), admin));
    }

    protected String logIn(String email) {
        Map<String, String> credentials = Map.of("email", email, "password", PASSWORD);

        return this.send(HttpMethod.POST, "/api/auth/login", null, credentials).getBody().get("token").asText();
    }

    protected ResponseEntity<JsonNode> send(HttpMethod method, String url, String token) {
        return this.send(method, url, token, null);
    }

    protected ResponseEntity<JsonNode> send(HttpMethod method, String url, String token, Object body) {
        return this.rest.exchange(url, method, new HttpEntity<>(body, this.headers(token)), JsonNode.class);
    }

    protected ResponseEntity<JsonNode> sendJson(HttpMethod method, String url, String token, String json) {
        HttpHeaders headers = this.headers(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return this.rest.exchange(url, method, new HttpEntity<>(json, headers), JsonNode.class);
    }

    protected ResponseEntity<JsonNode> sendWithAuthorization(HttpMethod method, String url, String authorization) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, authorization);
        return this.rest.exchange(url, method, new HttpEntity<>(headers), JsonNode.class);
    }

    private HttpHeaders headers(String token) {
        HttpHeaders headers = new HttpHeaders();
        if (token != null) {
            headers.setBearerAuth(token);
        }
        return headers;
    }
}
