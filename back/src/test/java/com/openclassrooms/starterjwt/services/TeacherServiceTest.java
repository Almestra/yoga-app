package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.repository.TeacherRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TeacherServiceTest {
    private final TeacherRepository teacherRepository = mock(TeacherRepository.class);

    private final TeacherService teacherService = new TeacherService(this.teacherRepository);

    @Test
    void anUnknownTeacherIsNotFound() {
        when(this.teacherRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> this.teacherService.findById(99L)).isInstanceOf(NotFoundException.class);
    }
}
