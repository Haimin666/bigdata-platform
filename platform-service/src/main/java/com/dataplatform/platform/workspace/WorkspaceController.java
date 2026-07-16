package com.dataplatform.platform.workspace;

import com.dataplatform.platform.common.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/platform/workspaces")
public class WorkspaceController {

  private final WorkspaceRepository workspaceRepository;

  public WorkspaceController(WorkspaceRepository workspaceRepository) {
    this.workspaceRepository = workspaceRepository;
  }

  @GetMapping
  public ApiResponse<List<Map<String, Object>>> list() {
    List<Map<String, Object>> list = workspaceRepository.findAll().stream()
        .map(w -> Map.<String, Object>of(
            "id", w.getId(),
            "name", w.getName(),
            "description", w.getDescription() == null ? "" : w.getDescription(),
            "isDefaultWorkspace", w.isDefault()))
        .toList();
    return ApiResponse.ok(list);
  }
}
