package com.dataplatform.platform.project;

import com.dataplatform.platform.auth.AuthService;
import com.dataplatform.platform.auth.User;
import com.dataplatform.platform.common.BizException;
import com.dataplatform.platform.project.dto.CreateProjectRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectService {

  private final ProjectRepository projectRepository;
  private final AuthService authService;

  public ProjectService(ProjectRepository projectRepository, AuthService authService) {
    this.projectRepository = projectRepository;
    this.authService = authService;
  }

  public List<Project> listByWorkspace(Long workspaceId) {
    return projectRepository.findByWorkspaceIdOrderByIdDesc(workspaceId);
  }

  public Project create(CreateProjectRequest req) {
    User user = authService.currentUser();
    if (projectRepository.findByWorkspaceIdOrderByIdDesc(req.workspaceId()).stream()
        .anyMatch(p -> p.getName().equalsIgnoreCase(req.name()))) {
      throw new BizException("工程名称已存在");
    }
    Project p = new Project();
    p.setName(req.name());
    p.setDescription(req.description());
    p.setBusiness(req.business());
    p.setApplicationArea(req.applicationArea());
    p.setWorkspaceId(req.workspaceId());
    p.setCreatedBy(user.getUsername());
    return projectRepository.save(p);
  }
}
