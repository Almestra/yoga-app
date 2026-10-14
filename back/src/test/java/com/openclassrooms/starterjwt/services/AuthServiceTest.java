package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.EmailAlreadyTakenException;
import com.openclassrooms.starterjwt.payload.request.SignupRequest;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthServiceTest {
    private final UserRepository userRepository = mock(UserRepository.class);

    // Registration uses neither the authentication manager nor the token utilities.
    private final AuthService authService = new AuthService(null, new BCryptPasswordEncoder(), null,
            this.userRepository);

    @Test
    void registeringWithAnEmailAlreadyUsedIsRefused() {
        when(this.userRepository.existsByEmail("taken@test.com")).thenReturn(true);
        SignupRequest request = new SignupRequest();
        request.setEmail("taken@test.com");
        request.setFirstName("John");
        request.setLastName("Doe");
        request.setPassword("test!1234");

        assertThatThrownBy(() -> this.authService.register(request)).isInstanceOf(EmailAlreadyTakenException.class);
    }
}
