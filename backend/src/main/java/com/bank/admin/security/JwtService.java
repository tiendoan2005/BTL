package com.bank.admin.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.function.Function;

/**
 * Sinh / xác thực JWT (HS256).
 * Claims: sub=username, uid, type=access|refresh.
 */
@Slf4j
@Service
public class JwtService {

    public static final String CLAIM_UID = "uid";
    public static final String CLAIM_TYPE = "type";
    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    private static final String ISSUER = "admin-portal";

    private final SecretKey key;
    private final long accessTtlMs;
    private final long refreshTtlMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-expiration-minutes}") long accessMinutes,
            @Value("${app.jwt.refresh-expiration-days}") long refreshDays) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT secret must be >= 32 bytes");
        }
        this.key = new SecretKeySpec(keyBytes, "HmacSHA256");
        this.accessTtlMs = accessMinutes * 60_000L;
        this.refreshTtlMs = refreshDays * 24 * 60 * 60_000L;
        log.info("JWT configured: access={}min, refresh={}days", accessMinutes, refreshDays);
    }

    public String generateAccessToken(UserPrincipal principal) {
        return buildToken(principal.getUsername(), principal.getId(),
            principal.getAuthoritiesString(), TYPE_ACCESS, accessTtlMs);
    }

    public String generateRefreshToken(UserPrincipal principal) {
        // Refresh token khong nhúng authorities - se reload tu DB khi doi token
        return buildToken(principal.getUsername(), principal.getId(), "", TYPE_REFRESH, refreshTtlMs);
    }

    private String buildToken(String username, Long userId, String authorities, String type, long ttlMs) {
        Instant now = Instant.now();
        return Jwts.builder()
            .issuer(ISSUER)
            .subject(username)
            .claim(CLAIM_UID, userId)
            .claim(CLAIM_TYPE, type)
            .claim("authorities", authorities)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusMillis(ttlMs)))
            .signWith(key)
            .compact();
    }

    /** Token hợp lệ VÀ đúng loại (access/refresh) mới được chấp nhận. */
    public boolean isValid(String token, String expectedType) {
        try {
            Claims claims = parse(token);
            return expectedType.equals(claims.get(CLAIM_TYPE, String.class));
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(parse(token));
    }

    public long getExpirationEpochMillis(String token) {
        return parse(token).getExpiration().getTime();
    }

    private Claims parse(String token) {
        return Jwts.parser().verifyWith(key).requireIssuer(ISSUER).build()
            .parseSignedClaims(token).getPayload();
    }
}
