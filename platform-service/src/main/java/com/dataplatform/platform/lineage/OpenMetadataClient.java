package com.dataplatform.platform.lineage;

import com.dataplatform.platform.common.BizException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * OpenMetadata 适配客户端：封装对现有 OM 实例的 REST 调用，
 * 把 OM 的血缘/搜索响应转换为前端画布（xyflow）友好的 {nodes, edges} 结构。
 * token 缺失时抛 503，token 失效抛 401，实例不可达抛 502。
 */
@Component
public class OpenMetadataClient {

  private static final Logger log = LoggerFactory.getLogger(OpenMetadataClient.class);

  private final RestClient restClient;
  private final ObjectMapper mapper = new ObjectMapper();
  private final String baseUrl;
  private final String token;

  public OpenMetadataClient(
      @Value("${platform.openmetadata.base-url:}") String baseUrl,
      @Value("${platform.openmetadata.token:}") String token) {
    this.baseUrl = baseUrl == null ? "" : baseUrl.replaceAll("/+$", "");
    this.token = token == null ? "" : token;
    this.restClient = RestClient.builder().build();
  }

  public boolean configured() {
    return !baseUrl.isBlank() && !token.isBlank();
  }

  private void requireConfigured() {
    if (!configured()) {
      throw new BizException(503, "OpenMetadata 未配置（OPENMETADATA_BASE_URL / OPENMETADATA_TOKEN 缺失）");
    }
  }

  /** 探活 + token 校验：取 version，再用一次需鉴权的轻量调用验证 token。 */
  public Map<String, Object> health() {
    requireConfigured();
    String version = "";
    try {
      String resp = get("/api/v1/system/version");
      version = mapper.readTree(resp).path("version").asText("");
    } catch (Exception ignored) {
      // version 失败不代表 token 失效，继续验证 token
    }
    get("/api/v1/tables?limit=1");
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("connected", true);
    out.put("version", version);
    out.put("baseUrl", baseUrl);
    return out;
  }

  /** 搜索实体（表/仪表盘/管道/主题等）。 */
  public List<Map<String, Object>> search(String q, int size) {
    requireConfigured();
    int s = Math.min(Math.max(size, 1), 100);
    String resp = get("/api/v1/search/query?q=" + enc(q) + "&from=0&size=" + s);
    List<Map<String, Object>> out = new ArrayList<>();
    try {
      JsonNode hits = mapper.readTree(resp).path("hits").path("hits");
      for (JsonNode h : hits) {
        JsonNode src = h.path("_source");
        if (src.isMissingNode()) src = h;
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("fqn", src.path("fqn").asText(src.path("fullyQualifiedName").asText("")));
        item.put("name", src.path("name").asText(""));
        item.put("entityType", src.path("entityType").asText(src.path("tableType").asText("")));
        item.put("displayName", src.path("displayName").asText(""));
        out.add(item);
      }
    } catch (Exception e) {
      log.warn("解析 OpenMetadata search 响应失败: {}", e.getMessage());
    }
    return out;
  }

  /** 按 FQN 取血缘图，转换为 {nodes, edges}。 */
  public Map<String, Object> lineage(String entityType, String fqn, int upDepth, int downDepth) {
    requireConfigured();
    int up = Math.min(Math.max(upDepth, 0), 5);
    int down = Math.min(Math.max(downDepth, 0), 5);
    String resp = get("/api/v1/lineage/" + enc(entityType) + "/name/" + enc(fqn)
        + "?upstreamDepth=" + up + "&downstreamDepth=" + down);
    List<Map<String, Object>> nodes = new ArrayList<>();
    List<Map<String, Object>> edges = new ArrayList<>();
    try {
      JsonNode root = mapper.readTree(resp);
      for (JsonNode n : root.path("nodes")) {
        nodes.add(toNode(n));
      }
      // 1.6 之前的旧形态回退：upstreams/downstreams
      if (nodes.isEmpty()) {
        for (String dir : List.of("upstreams", "downstreams")) {
          for (JsonNode n : root.path(dir)) {
            nodes.add(toNode(n));
          }
        }
      }
      // OM 1.6：查询实体本身在 entity 字段，不在 nodes 里；补进去才能作为焦点节点
      JsonNode entity = root.path("entity");
      if (!entity.isMissingNode() && !entity.path("id").asText("").isEmpty()) {
        nodes.add(toNode(entity));
      }
      // 若 entity 也缺失，用查询 FQN 兜底一个焦点节点，确保画布非空
      if (nodes.stream().noneMatch(n -> fqn.equals(n.get("fqn")))) {
        Map<String, Object> self = new LinkedHashMap<>();
        self.put("id", "self");
        self.put("label", fqn);
        self.put("entityType", entityType);
        self.put("fqn", fqn);
        self.put("deleted", false);
        nodes.add(self);
      }
      // OM 1.6：边在 upstreamEdges / downstreamEdges，每条 {fromEntity, toEntity}
      for (String key : List.of("upstreamEdges", "downstreamEdges")) {
        for (JsonNode e : root.path(key)) {
          Map<String, Object> edge = new LinkedHashMap<>();
          edge.put("source", e.path("fromEntity").asText(""));
          edge.put("target", e.path("toEntity").asText(""));
          edges.add(edge);
        }
      }
      // 兼容老形态 edges 字段（fromId/toId）
      for (JsonNode e : root.path("edges")) {
        Map<String, Object> edge = new LinkedHashMap<>();
        edge.put("source", e.path("fromId").asText(e.path("fromEntity").asText("")));
        edge.put("target", e.path("toId").asText(e.path("toEntity").asText("")));
        edges.add(edge);
      }
    } catch (Exception e) {
      log.warn("解析 OpenMetadata lineage 响应失败: {}", e.getMessage());
    }
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("nodes", nodes);
    out.put("edges", edges);
    out.put("entityType", entityType);
    out.put("fqn", fqn);
    return out;
  }

  /** 按 FQN 取表详情：列、描述、owner、所属库。 */
  public Map<String, Object> tableDetail(String fqn) {
    requireConfigured();
    String resp = get("/api/v1/tables/name/" + enc(fqn) + "?fields=columns,owners,tags");
    Map<String, Object> out = new LinkedHashMap<>();
    try {
      JsonNode t = mapper.readTree(resp);
      out.put("name", t.path("name").asText(""));
      out.put("displayName", t.path("displayName").asText(""));
      out.put("fqn", t.path("fullyQualifiedName").asText(fqn));
      out.put("entityType", "table");
      out.put("description", t.path("description").asText(""));
      out.put("database", t.path("database").path("fullyQualifiedName").asText(""));
      out.put("owner", t.path("owners").path(0).path("displayName").asText(t.path("owners").path(0).path("name").asText("")));
      out.put("updatedAt", t.path("updatedAt").asLong(0));
      out.put("updatedBy", t.path("updatedBy").asText(""));
      List<Map<String, Object>> columns = new ArrayList<>();
      for (JsonNode c : t.path("columns")) {
        Map<String, Object> col = new LinkedHashMap<>();
        col.put("name", c.path("name").asText(""));
        col.put("dataType", c.path("dataType").asText(c.path("dataTypeDisplay").asText("")));
        col.put("description", c.path("description").asText(""));
        col.put("tags", c.path("tags").findValuesAsText("label"));
        columns.add(col);
      }
      out.put("columns", columns);
    } catch (Exception e) {
      log.warn("解析 OpenMetadata tableDetail 响应失败: {}", e.getMessage());
    }
    return out;
  }

  private Map<String, Object> toNode(JsonNode n) {
    String label = n.path("displayName").asText("");
    if (label.isBlank()) label = n.path("name").asText("");
    if (label.isBlank()) label = n.path("fqn").asText("");
    Map<String, Object> node = new LinkedHashMap<>();
    node.put("id", n.path("id").asText(""));
    node.put("label", label);
    node.put("entityType", n.path("type").asText(n.path("entity").asText("")));
    node.put("fqn", n.path("fullyQualifiedName").asText(n.path("fqn").asText("")));
    node.put("deleted", n.path("deleted").asBoolean(false));
    return node;
  }

  private String get(String path) {
    // path 中的中文/特殊字符已用 URLEncoder 编码；用 URI.create 构造再传 URI 对象，
    // 避免 RestClient 把已编码的 %XX 二次编码成 %25XX（导致 OM 收到错误 FQN 返回 404）
    java.net.URI uri = java.net.URI.create(baseUrl + path);
    try {
      return restClient.get()
          .uri(uri)
          .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
          .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
          .retrieve()
          .body(String.class);
    } catch (HttpClientErrorException.Unauthorized e) {
      log.warn("OpenMetadata token 无效或已过期（{}）: {}", path, e.getMessage());
      throw new BizException(401, "OpenMetadata token 无效或已过期");
    } catch (HttpClientErrorException.Forbidden e) {
      log.warn("OpenMetadata token 权限不足（{}）: {}", path, e.getMessage());
      throw new BizException(403, "OpenMetadata token 权限不足");
    } catch (HttpClientErrorException.NotFound e) {
      throw new BizException(404, "OpenMetadata 资源不存在: " + path);
    } catch (Exception e) {
      log.warn("OpenMetadata 调用失败 {}: {}", path, e.getMessage());
      throw new BizException(502, "OpenMetadata 不可达: " + e.getMessage());
    }
  }

  private String enc(String v) {
    return URLEncoder.encode(v == null ? "" : v, StandardCharsets.UTF_8);
  }
}
