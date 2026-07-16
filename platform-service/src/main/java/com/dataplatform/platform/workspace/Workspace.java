package com.dataplatform.platform.workspace;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "platform_workspace")
public class Workspace {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 128)
  private String name;

  @Column(length = 512)
  private String description;

  @Column(name = "is_default")
  private boolean isDefault;

  @Column(name = "created_by", length = 64)
  private String createdBy;

  @Column(name = "created_at")
  private Instant createdAt = Instant.now();

  public Long getId() { return id; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public boolean isDefault() { return isDefault; }
  public void setDefault(boolean isDefault) { this.isDefault = isDefault; }
  public String getCreatedBy() { return createdBy; }
  public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
  public Instant getCreatedAt() { return createdAt; }
}
