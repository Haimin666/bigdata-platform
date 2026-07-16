package com.dataplatform.platform.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateProjectRequest(
    @NotBlank(message = "工程名称不能为空") String name,
    String description,
    String business,
    String applicationArea,
    @NotNull(message = "workspaceId 不能为空") Long workspaceId) {}
