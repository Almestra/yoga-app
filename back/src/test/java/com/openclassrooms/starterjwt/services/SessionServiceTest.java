package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.dto.SessionDto;
import com.openclassrooms.starterjwt.exception.BadRequestException;
import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.mapper.SessionMapper;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.SessionRepository;
import com.openclassrooms.starterjwt.repository.TeacherRepository;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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

    @Test
    void creatingASessionWithAnUnknownTeacherIsABadRequest() {
        when(this.teacherRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> this.sessionService.create(sessionDto(99L)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void updatingASessionWithAnUnknownTeacherIsABadRequest() {
        when(this.sessionRepository.findById(1L)).thenReturn(Optional.of(new Session().setId(1L)));
        when(this.teacherRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> this.sessionService.update(1L, sessionDto(99L)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void anUpdateChangesTheSessionButKeepsItsParticipantsAndCreationDate() {
        User participant = new User().setId(5L);
        LocalDateTime createdAt = LocalDateTime.of(2026, 10, 1, 8, 0);
        Session stored = new Session().setId(1L).setName("Yoga").setDate(new Date(0)).setDescription("Breathe")
                .setTeacher(new Teacher().setId(3L)).setUsers(new ArrayList<>(List.of(participant)))
                .setCreatedAt(createdAt);
        Teacher helene = new Teacher().setId(4L);
        when(this.sessionRepository.findById(1L)).thenReturn(Optional.of(stored));
        when(this.teacherRepository.findById(4L)).thenReturn(Optional.of(helene));
        when(this.sessionRepository.save(any(Session.class))).thenAnswer(invocation -> invocation.getArgument(0));
        Date date = new Date();

        Session updated = this.sessionService.update(1L,
                new SessionDto(null, "Yoga Nidra", date, 4L, "Relax", List.of(8L), null, null));

        assertThat(updated.getName()).isEqualTo("Yoga Nidra");
        assertThat(updated.getDate()).isEqualTo(date);
        assertThat(updated.getDescription()).isEqualTo("Relax");
        assertThat(updated.getTeacher()).isEqualTo(helene);
        assertThat(updated.getUsers()).containsExactly(participant);
        assertThat(updated.getCreatedAt()).isEqualTo(createdAt);
    }

    @Test
    void updatingAnUnknownSessionIsNotFound() {
        when(this.sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> this.sessionService.update(99L, sessionDto(3L)))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void deletingAnUnknownSessionIsNotFound() {
        when(this.sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> this.sessionService.delete(99L)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void aUserEnrolsInASession() {
        User user = new User().setId(5L);
        Session yoga = sessionWith();
        when(this.sessionRepository.findById(1L)).thenReturn(Optional.of(yoga));
        when(this.userRepository.findById(5L)).thenReturn(Optional.of(user));

        this.sessionService.participate(1L, 5L);

        assertThat(yoga.getUsers()).containsExactly(user);
    }

    @Test
    void enrollingTwiceIsABadRequest() {
        User user = new User().setId(5L);
        when(this.sessionRepository.findById(1L)).thenReturn(Optional.of(sessionWith(user)));
        when(this.userRepository.findById(5L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> this.sessionService.participate(1L, 5L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void enrollingInAnUnknownSessionIsNotFound() {
        when(this.sessionRepository.findById(99L)).thenReturn(Optional.empty());
        when(this.userRepository.findById(5L)).thenReturn(Optional.of(new User().setId(5L)));

        assertThatThrownBy(() -> this.sessionService.participate(99L, 5L)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void enrollingAnUnknownUserIsNotFound() {
        when(this.sessionRepository.findById(1L)).thenReturn(Optional.of(sessionWith()));
        when(this.userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> this.sessionService.participate(1L, 99L)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void aUserWithdrawsFromASessionAndTheOthersStay() {
        User other = new User().setId(8L);
        Session yoga = sessionWith(new User().setId(5L), other);
        when(this.sessionRepository.findById(1L)).thenReturn(Optional.of(yoga));

        this.sessionService.noLongerParticipate(1L, 5L);

        assertThat(yoga.getUsers()).containsExactly(other);
    }

    @Test
    void withdrawingWithoutBeingEnrolledIsABadRequest() {
        when(this.sessionRepository.findById(1L)).thenReturn(Optional.of(sessionWith(new User().setId(8L))));

        assertThatThrownBy(() -> this.sessionService.noLongerParticipate(1L, 5L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void withdrawingFromAnUnknownSessionIsNotFound() {
        when(this.sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> this.sessionService.noLongerParticipate(99L, 5L))
                .isInstanceOf(NotFoundException.class);
    }

    private static Session sessionWith(User... participants) {
        return new Session().setId(1L).setName("Yoga").setUsers(new ArrayList<>(List.of(participants)));
    }

    private static SessionDto sessionDto(Long teacherId) {
        return new SessionDto(null, "Yoga", new Date(), teacherId, "Breathe", null, null, null);
    }
}
