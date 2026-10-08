package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PreAuthorize("#id == principal.id")
    public void delete(Long id) {
        this.userRepository.delete(this.findById(id));
    }

    @PreAuthorize("hasRole('ADMIN') or #id == principal.id")
    public User findById(Long id) {
        return this.userRepository.findById(id).orElseThrow(NotFoundException::new);
    }
}
