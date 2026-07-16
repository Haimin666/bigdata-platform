package com.dataplatform.platform.project;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "platform_project")
public class Project {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 128)
  private String name;

  @Column(length = 512)
  private String description;

  @Column(name = "application_area", length = 64)
  private String applicationArea;

  @Column(length = 32)
  private String product = "DSS";

  @Column(length = 64)
  private String business;

  @Column(length = 32)
  private String visibility = "公开";

  @Column(name = "workspace_id", nullable = false)
  private Long workspaceId;

  @Column(name = "created_by", length = 64)
  private String createdBy;

  @Column(name = "created_at")
  private Instant createdAt = Instant.now();

  public Long getId() { return id; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public String getApplicationArea() { return applicationArea; }
  public void setApplicationArea(String applicationArea) { this.applicationArea = applicationArea; }
  public String getProduct() { return product; }
  public void setProduct(String product) { this.product = product; }
  public String getBusiness() { return business; }
  public void setBusiness(String business) { this.business = business; }
  public String getVisibility() { return visibility; }
  public void setVisibility(String visibility) { this.visibility = visibility; }
  public Long getWorkspaceId() { return workspaceId; }
  public void setWorkspaceId(Long workspaceId) { this.workspaceId = workspaceId; }
  public String getCreatedBy() { return createdBy; }
  public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
  public Instant getCreatedAt() { return createdAt; }
}
