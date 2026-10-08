package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.SessionRepository;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;

    public UserService(UserRepository userRepository, SessionRepository sessionRepository) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
    }

    @Transactional
    @PreAuthorize("#id == principal.id")
    public void delete(Long id) {
        User user = this.findById(id);
        this.sessionRepository.findByUsersId(id).forEach(session -> session.getUsers().removeIf(user::equals));
        this.userRepository.delete(user);
    }

    @PreAuthorize("hasRole('ADMIN') or #id == principal.id")
    public User findById(Long id) {
        return this.userRepository.findById(id).orElseThrow(NotFoundException::new);
    }
}
