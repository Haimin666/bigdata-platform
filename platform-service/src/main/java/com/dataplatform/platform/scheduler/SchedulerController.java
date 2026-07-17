package com.dataplatform.platform.scheduler;

import com.dataplatform.platform.common.ApiResponse;
import com.dataplatform.platform.common.PageResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 离线调度适配控制器：把 DolphinScheduler 封装为平台统一信封。
 * 路径前缀 /api/platform/scheduler，继承全局 JWT 鉴权。
 * 项目/工作流走方案 B（全量，形状统一为 PageResult.full）；运行历史服务端分页 + 近 3 天。
 */
@RestController
@RequestMapping("/api/platform/scheduler")
public class SchedulerController {

  private final DolphinSchedulerClient client;

  public SchedulerController(DolphinSchedulerClient client) {
    this.client = client;
  }

  /** 列出 DS 项目（全量，统一分页形状）。 */
  @GetMapping("/projects")
  public ApiResponse<PageResult<Map<String, Object>>> projects() {
    return ApiResponse.ok(PageResult.full(client.projects()));
  }

  /** 列出某项目下的工作流定义（全量，统一分页形状）。 */
  @GetMapping("/projects/{projectName}/workflows")
  public ApiResponse<PageResult<Map<String, Object>>> workflows(@PathVariable String projectName) {
    return ApiResponse.ok(PageResult.full(client.processDefinitions(projectName)));
  }

  /** 取单个工作流定义（含 DAG JSON）。 */
  @GetMapping("/projects/{projectName}/workflows/{processId}")
  public ApiResponse<Map<String, Object>> workflow(@PathVariable String projectName, @PathVariable long processId) {
    return ApiResponse.ok(client.processDefinition(projectName, processId));
  }

  /** 上线/下线工作流。 */
  @PostMapping("/projects/{projectName}/workflows/{processId}/release")
  public ApiResponse<Object> release(@PathVariable String projectName, @PathVariable long processId,
      @RequestParam(defaultValue = "true") boolean online) {
    return ApiResponse.ok(client.release(projectName, processId, online));
  }

  /** 触发执行工作流（手动运行一次）。 */
  @PostMapping("/projects/{projectName}/workflows/{processId}/trigger")
  public ApiResponse<Object> trigger(@PathVariable String projectName, @PathVariable long processId) {
    return ApiResponse.ok(client.trigger(projectName, processId));
  }

  /** 运行历史（近 3 天，服务端分页）。 */
  @GetMapping("/projects/{projectName}/instances")
  public ApiResponse<PageResult<Map<String, Object>>> instances(@PathVariable String projectName,
      @RequestParam(defaultValue = "1") int pageNo,
      @RequestParam(defaultValue = "20") int pageSize) {
    return ApiResponse.ok(client.instances(projectName, pageNo, pageSize));
  }
}
