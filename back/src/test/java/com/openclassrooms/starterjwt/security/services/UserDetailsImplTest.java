package com.openclassrooms.starterjwt.security.services;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import static org.assertj.core.api.Assertions.assertThat;

class UserDetailsImplTest {

    @Test
    void anAdministratorHasOnlyTheAdminRole() {
        UserDetailsImpl admin = UserDetailsImpl.builder().id(1L).username("admin@test.com").admin(true).build();

        assertThat(admin.getAuthorities()).extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_ADMIN");
    }

    @Test
    void aUserHasOnlyTheUserRole() {
        UserDetailsImpl user = UserDetailsImpl.builder().id(2L).username("user@test.com").admin(false).build();

        assertThat(user.getAuthorities()).extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_USER");
    }
}
