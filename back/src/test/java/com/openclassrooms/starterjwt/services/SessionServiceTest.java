package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.mapper.SessionMapper;
import com.openclassrooms.starterjwt.repository.SessionRepository;
import com.openclassrooms.starterjwt.repository.TeacherRepository;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SessionServiceTest {
    private final SessionRepository sessionRepository = mock(SessionRepository.class);

    private final TeacherRepository teacherRepository = mock(TeacherRepository.class);

    private final UserRepository userRepository = mock(UserRepository.class);

    // The real mapper: only the repositories are replaced.
    private final SessionService sessionService = new SessionService(this.sessionRepository, this.teacherRepository,
            this.userRepository, Mappers.getMapper(SessionMapper.class));

    @Test
    void anUnknownSessionIsNotFound() {
        when(this.sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> this.sessionService.getById(99L)).isInstanceOf(NotFoundException.class);
    }
}
