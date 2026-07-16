package com.dataplatform.platform.auth;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "platform_user")
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 64)
  private String username;

  @Column(nullable = false)
  private String password;

  @Column(name = "display_name", length = 128)
  private String displayName;

  @Column(nullable = false, length = 32)
  private String role = "USER";

  @Column(name = "created_at")
  private Instant createdAt = Instant.now();

  public Long getId() { return id; }
  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }
  public String getPassword() { return password; }
  public void setPassword(String password) { this.password = password; }
  public String getDisplayName() { return displayName; }
  public void setDisplayName(String displayName) { this.displayName = displayName; }
  public String getRole() { return role; }
  public void setRole(String role) { this.role = role; }
  public Instant getCreatedAt() { return createdAt; }
  public boolean isAdmin() { return "ADMIN".equalsIgnoreCase(role); }
}
