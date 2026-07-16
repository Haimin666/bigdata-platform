package com.dataplatform.platform.gateway;

import com.dataplatform.platform.common.BizException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * 内置网关：把前端 /api/linkis/** 请求转发到 Linkis（/api/rest_j/v1/**）。
 * LINKIS_MOCK=true 时不转发，直接返回与 Linkis 同构的 mock 响应，便于无 Linkis 时跑通演示。
 */
@RestController
@RequestMapping("/api/linkis/**")
public class LinkisProxyController {

  private static final Logger log = LoggerFactory.getLogger(LinkisProxyController.class);

  private final boolean mock;
  private final String baseUrl;
  private final RestClient restClient;

  public LinkisProxyController(
      @Value("${platform.linkis.mock:false}") boolean mock,
      @Value("${platform.linkis.base-url}") String baseUrl) {
    this.mock = mock;
    this.baseUrl = baseUrl;
    this.restClient = RestClient.builder().build();
  }

  @RequestMapping
  public ResponseEntity<?> proxy(
      HttpServletRequest request, @RequestBody(required = false) String body) {
    String subPath = request.getRequestURI().substring("/api/linkis".length());
    if (mock) {
      return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(mockBody(subPath));
    }
    String query = request.getQueryString() == null ? "" : "?" + request.getQueryString();
    String target = baseUrl + "/api/rest_j/v1" + subPath + query;
    try {
      String resp = restClient
          .method(HttpMethod.valueOf(request.getMethod()))
          .uri(target)
          .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
          .header("Content-language", headerOrDefault(request, "Content-language", "zh-CN"))
          .body(body)
          .retrieve()
          .body(String.class);
      return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(resp);
    } catch (Exception e) {
      log.warn("Linkis 代理失败 {}: {}", target, e.getMessage());
      throw new BizException(502, "Linkis 不可达: " + e.getMessage());
    }
  }

  private String headerOrDefault(HttpServletRequest req, String name, String def) {
    String v = req.getHeader(name);
    return v == null ? def : v;
  }

  /** 返回 Linkis 风格信封 {status,message,data}，与前端解包逻辑一致。 */
  private Map<String, Object> mockBody(String subPath) {
    Object data = Map.of();
    if (subPath.endsWith("/filesystem/getDirFileTrees")) {
      data = Map.of("files", List.of(
          Map.of("id", "s1", "name", "user_stats.sql", "type", "spark.sql",
              "content", "-- 用户统计\nSELECT dt, COUNT(DISTINCT user_id) AS uv FROM dss_demo.user_access_log GROUP BY dt LIMIT 100;",
              "updateBy", "admin", "updateTime", "2025-06-20 14:10"),
          Map.of("id", "s2", "name", "etl_orders.sql", "type", "hive.sql",
              "content", "-- 订单清洗\nINSERT OVERWRITE TABLE dss_demo.dwd_orders SELECT * FROM ods.ods_orders;",
              "updateBy", "admin", "updateTime", "2025-06-18 09:30")));
    } else if (subPath.endsWith("/filesystem/openFile")) {
      data = Map.of("script", Map.of("id", "s1", "name", "user_stats.sql", "type", "spark.sql",
          "content", "-- 用户统计\nSELECT dt, COUNT(DISTINCT user_id) AS uv FROM dss_demo.user_access_log GROUP BY dt LIMIT 100;",
          "updateBy", "admin", "updateTime", "2025-06-20 14:10"));
    } else if (subPath.endsWith("/filesystem/saveScript")) {
      data = Map.of();
    } else if (subPath.endsWith("/entrance/execute")) {
      data = Map.of(
          "taskId", "task_mock_001",
          "status", "success",
          "columns", List.of(
              Map.of("name", "dt", "type", "string"),
              Map.of("name", "uv", "type", "bigint")),
          "rows", List.of(
              List.of("2025-06-20", 128034),
              List.of("2025-06-19", 125871),
              List.of("2025-06-18", 124002)),
          "durationMs", 2480,
          "log", List.of("> submit to linkis (mock)", "fetched 3 rows", "任务执行成功"));
    } else if (subPath.endsWith("/jobhistory/governanceStationAdmin")) {
      data = Map.of("admin", true);
    }
    return Map.of("status", 0, "message", "ok", "data", data);
  }
}
