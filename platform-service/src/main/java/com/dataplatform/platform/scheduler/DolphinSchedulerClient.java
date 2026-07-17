package com.dataplatform.platform.scheduler;

import com.dataplatform.platform.common.BizException;
import com.dataplatform.platform.common.PageResult;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * DolphinScheduler 2.x 适配客户端：封装对现有 DS 实例的 REST 调用，
 * 覆盖项目/工作流定义/上下线/触发执行/运行历史。认证用 API token（token 请求头）。
 * DS 响应信封 {code, msg, data}，code=0 成功；非 0 抛 502 并带 msg。
 * 项目/工作流走方案 B（全量返回但形状统一成 PageResult）；运行历史服务端分页且限定近 3 天。
 */
@Component
public class DolphinSchedulerClient {

  private static final Logger log = LoggerFactory.getLogger(DolphinSchedulerClient.class);
  private static final DateTimeFormatter DS_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
  private static final TypeReference<List<Map<String, Object>>> LIST_MAP = new TypeReference<>() {};
  private static final TypeReference<Map<String, Object>> MAP = new TypeReference<>() {};

  private final RestClient restClient;
  private final ObjectMapper mapper = new ObjectMapper();
  private final String baseUrl;
  private final String token;

  public DolphinSchedulerClient(
      @Value("${platform.dolphinscheduler.base-url:}") String baseUrl,
      @Value("${platform.dolphinscheduler.token:}") String token) {
    this.baseUrl = baseUrl == null ? "" : baseUrl.replaceAll("/+$", "");
    this.token = token == null ? "" : token;
    this.restClient = RestClient.builder().build();
  }

  public boolean configured() {
    return !baseUrl.isBlank() && !token.isBlank();
  }

  private void requireConfigured() {
    if (!configured()) {
      throw new BizException(503, "DolphinScheduler 未配置（DOLPHINSCHEDULER_BASE_URL / DOLPHINSCHEDULER_TOKEN 缺失）");
    }
  }

  /** 列出所有项目（query-project-list）。方案 B：全量返回。 */
  public List<Map<String, Object>> projects() {
    return mapper.convertValue(
        dataNode(HttpMethod.GET, "/projects/query-project-list", Map.of(), null), LIST_MAP);
  }

  /** 列出某项目下的工作流定义（process/list）。方案 B：全量返回。 */
  public List<Map<String, Object>> processDefinitions(String projectName) {
    return mapper.convertValue(
        dataNode(HttpMethod.GET, "/projects/" + enc(projectName) + "/process/list", Map.of(), null), LIST_MAP);
  }

  /** 取单个工作流定义（含 processDefinitionJson DAG，select-by-id）。 */
  public Map<String, Object> processDefinition(String projectName, long processId) {
    return mapper.convertValue(
        dataNode(HttpMethod.GET, "/projects/" + enc(projectName) + "/process/select-by-id",
            Map.of("processId", String.valueOf(processId)), null), MAP);
  }

  /** 上线/下线工作流（release）。releaseState: ONLINE / OFFLINE。 */
  public Object release(String projectName, long processId, boolean online) {
    return dataNode(HttpMethod.POST, "/projects/" + enc(projectName) + "/process/release",
        Map.of("processId", String.valueOf(processId), "releaseState", online ? "ONLINE" : "OFFLINE"), null);
  }

  /** 触发执行工作流（start-process-instance，手动运行一次）。 */
  public Object trigger(String projectName, long processDefinitionId) {
    Map<String, String> params = new LinkedHashMap<>();
    params.put("processDefinitionId", String.valueOf(processDefinitionId));
    params.put("scheduleTime", "");
    params.put("failureStrategy", "CONTINUE");
    params.put("startNodeList", "");
    params.put("taskDependType", "TASK_POST");
    params.put("processInstancePriority", "MEDIUM");
    params.put("warningType", "NONE");
    params.put("warningGroupId", "0");
    params.put("workerGroup", "default");
    return dataNode(HttpMethod.POST, "/projects/" + enc(projectName) + "/executors/start-process-instance", params, null);
  }

  /**
   * 运行历史（instance/list-paging），归一成统一 PageResult。
   * 限定近 3 天（startDate/endDate）避免无界增长；DS data = {totalList,total,currentPage,totalPage}。
   */
  public PageResult<Map<String, Object>> instances(String projectName, int pageNo, int pageSize) {
    LocalDate today = LocalDate.now();
    String start = today.minusDays(2).atStartOfDay().format(DS_TIME);
    String end = today.atTime(23, 59, 59).format(DS_TIME);
    JsonNode data = dataNode(HttpMethod.GET, "/projects/" + enc(projectName) + "/instance/list-paging",
        Map.of("pageNo", String.valueOf(pageNo), "pageSize", String.valueOf(pageSize),
            "startDate", start, "endDate", end), null);
    List<Map<String, Object>> records = mapper.convertValue(data.path("totalList"), LIST_MAP);
    long total = data.path("total").asLong(0);
    int page = data.path("currentPage").asInt(pageNo);
    int totalPage = data.path("totalPage").asInt(0);
    return new PageResult<>(records, total, page, pageSize, totalPage);
  }

  /** 底层调用：返回 DS 响应的 data 节点（JsonNode），由上层按需归一。 */
  private JsonNode dataNode(HttpMethod method, String path, Map<String, String> params, String body) {
    requireConfigured();
    String qs = params.entrySet().stream()
        .map(e -> enc(e.getKey()) + "=" + enc(e.getValue()))
        .collect(Collectors.joining("&"));
    URI uri = URI.create(baseUrl + path + (qs.isEmpty() ? "" : "?" + qs));
    try {
      RestClient.RequestBodySpec spec = restClient.method(method).uri(uri)
          .header("token", token)
          .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
      if (body != null) spec.body(body);
      String resp = spec.retrieve().body(String.class);
      JsonNode root = mapper.readTree(resp);
      int code = root.path("code").asInt(-1);
      if (code != 0) {
        String msg = root.path("msg").asText("unknown error");
        if (code == 30002) {
          throw new BizException(403, "DolphinScheduler: " + msg);
        }
        if (code == 10003) {
          throw new BizException(401, "DolphinScheduler token 无效或已过期");
        }
        throw new BizException(502, "DolphinScheduler: " + msg);
      }
      return root.path("data");
    } catch (HttpClientErrorException.Unauthorized e) {
      log.warn("DolphinScheduler token 无效或已过期（{}）: {}", path, e.getMessage());
      throw new BizException(401, "DolphinScheduler token 无效或已过期");
    } catch (HttpClientErrorException.Forbidden e) {
      throw new BizException(403, "DolphinScheduler token 权限不足");
    } catch (BizException e) {
      throw e;
    } catch (Exception e) {
      log.warn("DolphinScheduler 调用失败 {}: {}", path, e.getMessage());
      throw new BizException(502, "DolphinScheduler 不可达: " + e.getMessage());
    }
  }

  private String enc(String v) {
    return URLEncoder.encode(v == null ? "" : v, StandardCharsets.UTF_8);
  }
}
