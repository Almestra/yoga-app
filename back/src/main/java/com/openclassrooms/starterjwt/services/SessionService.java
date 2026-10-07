package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.dto.SessionDto;
import com.openclassrooms.starterjwt.exception.BadRequestException;
import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.mapper.SessionMapper;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.SessionRepository;
import com.openclassrooms.starterjwt.repository.TeacherRepository;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SessionService {
    private final SessionRepository sessionRepository;

    private final TeacherRepository teacherRepository;

    private final UserRepository userRepository;

    private final SessionMapper sessionMapper;

    public SessionService(SessionRepository sessionRepository, TeacherRepository teacherRepository,
                          UserRepository userRepository, SessionMapper sessionMapper) {
        this.sessionRepository = sessionRepository;
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
        this.sessionMapper = sessionMapper;
    }

    public Session create(SessionDto sessionDto) {
        return this.sessionRepository.save(this.toEntity(sessionDto));
    }

    public void delete(Long id) {
        this.sessionRepository.deleteById(id);
    }

    public List<Session> findAll() {
        return this.sessionRepository.findAll();
    }

    public Session getById(Long id) {
        return this.sessionRepository.findById(id).orElse(null);
    }

    public Session update(Long id, SessionDto sessionDto) {
        Session session = this.toEntity(sessionDto);
        session.setId(id);
        return this.sessionRepository.save(session);
    }

    public void participate(Long id, Long userId) {
        Session session = this.sessionRepository.findById(id).orElse(null);
        User user = this.userRepository.findById(userId).orElse(null);
        if (session == null || user == null) {
            throw new NotFoundException();
        }

        boolean alreadyParticipate = session.getUsers().stream().anyMatch(o -> o.getId().equals(userId));
        if (alreadyParticipate) {
            throw new BadRequestException();
        }

        session.getUsers().add(user);

        this.sessionRepository.save(session);
    }

    public void noLongerParticipate(Long id, Long userId) {
        Session session = this.sessionRepository.findById(id).orElse(null);
        if (session == null) {
            throw new NotFoundException();
        }

        boolean alreadyParticipate = session.getUsers().stream().anyMatch(o -> o.getId().equals(userId));
        if (!alreadyParticipate) {
            throw new BadRequestException();
        }

        session.setUsers(session.getUsers().stream().filter(user -> !user.getId().equals(userId)).collect(Collectors.toList()));

        this.sessionRepository.save(session);
    }

    private Session toEntity(SessionDto sessionDto) {
        Session session = this.sessionMapper.toEntity(sessionDto);
        session.setTeacher(this.teacherRepository.findById(sessionDto.getTeacher_id()).orElse(null));
        session.setUsers(Optional.ofNullable(sessionDto.getUsers()).orElseGet(Collections::emptyList).stream()
                .map(userId -> this.userRepository.findById(userId).orElse(null))
                .collect(Collectors.toList()));
        return session;
    }
}
