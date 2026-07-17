package com.dataplatform.platform.lineage;

import com.dataplatform.platform.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 数据血缘适配控制器：把 OpenMetadata 的血缘/搜索封装为平台统一信封。
 * 路径前缀 /api/platform/lineage，继承全局 JWT 鉴权。
 */
@RestController
@RequestMapping("/api/platform/lineage")
public class LineageController {

  private final OpenMetadataClient client;

  public LineageController(OpenMetadataClient client) {
    this.client = client;
  }

  /** 探活 + token 校验。 */
  @GetMapping("/health")
  public ApiResponse<Map<String, Object>> health() {
    return ApiResponse.ok(client.health());
  }

  /** 搜索实体，供前端血缘入口选择目标。 */
  @GetMapping("/search")
  public ApiResponse<List<Map<String, Object>>> search(
      @RequestParam String q,
      @RequestParam(defaultValue = "20") int size) {
    return ApiResponse.ok(client.search(q, size));
  }

  /** 按 FQN 取表详情（列、描述、owner、所属库），供节点抽屉展示。 */
  @GetMapping("/table/detail/{fqn}")
  public ApiResponse<Map<String, Object>> tableDetail(@PathVariable String fqn) {
    return ApiResponse.ok(client.tableDetail(fqn));
  }

  /** 按 FQN 取血缘图（upstream/downstream 深度可调）。 */
  @GetMapping("/{entityType}/name/{fqn}")
  public ApiResponse<Map<String, Object>> lineage(
      @PathVariable String entityType,
      @PathVariable String fqn,
      @RequestParam(defaultValue = "1") int upstreamDepth,
      @RequestParam(defaultValue = "1") int downstreamDepth) {
    return ApiResponse.ok(client.lineage(entityType, fqn, upstreamDepth, downstreamDepth));
  }
}
