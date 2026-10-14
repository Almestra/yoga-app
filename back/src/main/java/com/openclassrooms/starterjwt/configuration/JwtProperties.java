package com.openclassrooms.starterjwt.configuration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

/**
 * Settings of the JSON Web Tokens issued by the API, read from the {@code jwt.*} properties.
 *
 * @param secret
 *            the key that signs and verifies the tokens, encoded in Base64
 * @param expiration
 *            how long a token remains valid, for example {@code 24h}
 */
@ConfigurationProperties(prefix = "jwt")
@Validated
public record JwtProperties(
        @NotBlank String secret,
        @NotNull Duration expiration) {
}
