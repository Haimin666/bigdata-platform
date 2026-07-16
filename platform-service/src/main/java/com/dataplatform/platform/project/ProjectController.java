package com.dataplatform.platform.project;

import com.dataplatform.platform.common.ApiResponse;
import com.dataplatform.platform.project.dto.CreateProjectRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/platform/projects")
public class ProjectController {

  private final ProjectService projectService;

  private static final DateTimeFormatter FMT =
      DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(ZoneId.systemDefault());

  public ProjectController(ProjectService projectService) {
    this.projectService = projectService;
  }

  @GetMapping
  public ApiResponse<List<Map<String, Object>>> list(@RequestParam Long workspaceId) {
    List<Map<String, Object>> list = projectService.listByWorkspace(workspaceId).stream()
        .map(this::toMap)
        .toList();
    return ApiResponse.ok(list);
  }

  @PostMapping
  public ApiResponse<Map<String, Object>> create(@Valid @RequestBody CreateProjectRequest req) {
    return ApiResponse.ok(toMap(projectService.create(req)));
  }

  private Map<String, Object> toMap(Project p) {
    return Map.of(
        "id", p.getId(),
        "name", p.getName(),
        "description", p.getDescription() == null ? "" : p.getDescription(),
        "applicationArea", p.getApplicationArea() == null ? "" : p.getApplicationArea(),
        "product", p.getProduct() == null ? "" : p.getProduct(),
        "business", p.getBusiness() == null ? "" : p.getBusiness(),
        "visibility", p.getVisibility() == null ? "" : p.getVisibility(),
        "createBy", p.getCreatedBy() == null ? "" : p.getCreatedBy(),
        "createTime", p.getCreatedAt() == null ? "" : FMT.format(p.getCreatedAt()),
        "workspaceId", p.getWorkspaceId());
  }
}
