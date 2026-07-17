package com.dataplatform.platform.streampark;

import com.dataplatform.platform.common.ApiResponse;
import com.dataplatform.platform.common.PageResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 实时开发适配控制器：把 StreamPark 的只读总览封装为平台统一信封。
 * 路径前缀 /api/platform/streampark，继承全局 JWT 鉴权。
 * 仅暴露只读端点（dashboard/projects/envs/clusters/teams/apps），不提供任何写操作。
 * 列表端点形状统一为 PageResult（projects/envs/clusters 走方案 B 全量；apps 服务端分页）。
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

  /** 团队下的 StreamPark 项目列表（全量，统一分页形状）。 */
  @GetMapping("/projects")
  public ApiResponse<PageResult<Map<String, Object>>> projects() {
    return ApiResponse.ok(PageResult.full(client.projects()));
  }

  /** Flink 环境列表（全量，统一分页形状）。 */
  @GetMapping("/envs")
  public ApiResponse<PageResult<Map<String, Object>>> envs() {
    return ApiResponse.ok(PageResult.full(client.envs()));
  }

  /** Flink 集群列表（全量，统一分页形状）。 */
  @GetMapping("/clusters")
  public ApiResponse<PageResult<Map<String, Object>>> clusters() {
    return ApiResponse.ok(PageResult.full(client.clusters()));
  }

  /** 团队列表。 */
  @GetMapping("/teams")
  public ApiResponse<Object> teams() {
    return ApiResponse.ok(client.teams());
  }

  /** Flink 应用列表（服务端分页，只读）。 */
  @GetMapping("/apps")
  public ApiResponse<PageResult<Map<String, Object>>> apps(
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "20") int pageSize) {
    return ApiResponse.ok(client.apps(pageNum, pageSize));
  }
}
