package com.openclassrooms.starterjwt.mapper;

import com.openclassrooms.starterjwt.dto.SessionDto;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.models.User;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SessionMapperTest {
    private final SessionMapper sessionMapper = Mappers.getMapper(SessionMapper.class);

    @Test
    void aSessionGivesTheIdentifiersOfItsTeacherAndParticipants() {
        Session session = new Session().setId(1L).setName("Yoga").setTeacher(new Teacher().setId(3L))
                .setUsers(List.of(new User().setId(5L), new User().setId(8L)));

        SessionDto dto = this.sessionMapper.toDto(session);

        assertThat(dto.getTeacher_id()).isEqualTo(3L);
        assertThat(dto.getUsers()).containsExactly(5L, 8L);
    }

    @Test
    void aSessionWithoutParticipantListGivesAnEmptyList() {
        Session session = new Session().setId(1L).setName("Yoga").setUsers(null);

        assertThat(this.sessionMapper.toDto(session).getUsers()).isEmpty();
    }

    @Test
    void aDtoGivesASessionWithoutItsIdTeacherOrParticipants() {
        Date date = new Date();
        SessionDto dto = new SessionDto(9L, "Yoga", date, 3L, "Breathe", List.of(5L), null, null);

        Session session = this.sessionMapper.toEntity(dto);

        assertThat(session.getName()).isEqualTo("Yoga");
        assertThat(session.getDate()).isEqualTo(date);
        assertThat(session.getDescription()).isEqualTo("Breathe");
        assertThat(session.getId()).isNull();
        assertThat(session.getTeacher()).isNull();
        assertThat(session.getUsers()).isNull();
    }
}
