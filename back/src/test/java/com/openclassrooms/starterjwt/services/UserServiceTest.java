package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.repository.SessionRepository;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserServiceTest {
    private final UserRepository userRepository = mock(UserRepository.class);

    private final UserService userService = new UserService(this.userRepository, mock(SessionRepository.class));

    @Test
    void anUnknownUserIsNotFound() {
        when(this.userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> this.userService.findById(99L)).isInstanceOf(NotFoundException.class);
    }
}
