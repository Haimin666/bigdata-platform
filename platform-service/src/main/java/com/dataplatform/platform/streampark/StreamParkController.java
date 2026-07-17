package com.dataplatform.platform.streampark;

import com.dataplatform.platform.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 实时开发适配控制器：把 StreamPark 的只读总览封装为平台统一信封。
 * 路径前缀 /api/platform/streampark，继承全局 JWT 鉴权。
 * 仅暴露只读端点（dashboard/projects/envs/clusters/teams），不提供任何写操作。
 */
@RestController
@RequestMapping("/api/platform/streampark")
public class StreamParkController {

  private final StreamParkClient client;

  public StreamParkController(StreamParkClient client) {
    this.client = client;
  }

  /** 实时集群总览（运行 job、slots、内存、task 状态分布）。 */
  @GetMapping("/dashboard")
  public ApiResponse<Object> dashboard() {
    return ApiResponse.ok(client.dashboard());
  }

  /** 团队下的 StreamPark 项目列表。 */
  @GetMapping("/projects")
  public ApiResponse<Object> projects() {
    return ApiResponse.ok(client.projects());
  }

  /** Flink 环境列表。 */
  @GetMapping("/envs")
  public ApiResponse<Object> envs() {
    return ApiResponse.ok(client.envs());
  }

  /** Flink 集群列表。 */
  @GetMapping("/clusters")
  public ApiResponse<Object> clusters() {
    return ApiResponse.ok(client.clusters());
  }

  /** 团队列表。 */
  @GetMapping("/teams")
  public ApiResponse<Object> teams() {
    return ApiResponse.ok(client.teams());
  }
}
