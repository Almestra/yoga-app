package com.openclassrooms.starterjwt.security.services;

import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserDetailsServiceImplTest {
    private final UserRepository userRepository = mock(UserRepository.class);

    private final UserDetailsServiceImpl userDetailsService = new UserDetailsServiceImpl(this.userRepository);

    @Test
    void anUnknownEmailIsRefused() {
        when(this.userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> this.userDetailsService.loadUserByUsername("unknown@test.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void aKnownAccountKeepsItsIdentityRoleAndPassword() {
        User user = new User("admin@test.com", "Doe", "John", "encoded-password", true).setId(7L);
        when(this.userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(user));

        UserDetailsImpl details = (UserDetailsImpl) this.userDetailsService.loadUserByUsername("admin@test.com");

        assertThat(details.getId()).isEqualTo(7L);
        assertThat(details.getUsername()).isEqualTo("admin@test.com");
        assertThat(details.getFirstName()).isEqualTo("John");
        assertThat(details.getLastName()).isEqualTo("Doe");
        assertThat(details.isAdmin()).isTrue();
        assertThat(details.getPassword()).isEqualTo("encoded-password");
    }
}
