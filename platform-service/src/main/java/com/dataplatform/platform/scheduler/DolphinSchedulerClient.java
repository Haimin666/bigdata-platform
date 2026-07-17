package com.dataplatform.platform.scheduler;

import com.dataplatform.platform.common.BizException;
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
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * DolphinScheduler 2.x 适配客户端：封装对现有 DS 实例的 REST 调用，
 * 覆盖项目/工作流定义/上下线/触发执行/运行历史。认证用 API token（token 请求头）。
 * DS 响应信封 {code, msg, data}，code=0 成功；非 0 抛 502 并带 msg。
 */
@Component
public class DolphinSchedulerClient {

  private static final Logger log = LoggerFactory.getLogger(DolphinSchedulerClient.class);

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

  /** 列出所有项目（query-project-list）。 */
  public Object projects() {
    return request(HttpMethod.GET, "/projects/query-project-list", Map.of(), null);
  }

  /** 列出某项目下的工作流定义（process/list）。 */
  public Object processDefinitions(String projectName) {
    return request(HttpMethod.GET, "/projects/" + enc(projectName) + "/process/list", Map.of(), null);
  }

  /** 取单个工作流定义（含 processDefinitionJson DAG，select-by-id）。 */
  public Object processDefinition(String projectName, long processId) {
    return request(HttpMethod.GET, "/projects/" + enc(projectName) + "/process/select-by-id",
        Map.of("processId", String.valueOf(processId)), null);
  }

  /** 上线/下线工作流（release）。releaseState: ONLINE / OFFLINE。 */
  public Object release(String projectName, long processId, boolean online) {
    return request(HttpMethod.POST, "/projects/" + enc(projectName) + "/process/release",
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
    return request(HttpMethod.POST, "/projects/" + enc(projectName) + "/executors/start-process-instance",
        params, null);
  }

  /** 运行历史（instance/list-paging）。 */
  public Object instances(String projectName, int pageNo, int pageSize) {
    return request(HttpMethod.GET, "/projects/" + enc(projectName) + "/instance/list-paging",
        Map.of("pageNo", String.valueOf(pageNo), "pageSize", String.valueOf(pageSize)), null);
  }

  private Object request(HttpMethod method, String path, Map<String, String> params, String body) {
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
        // DS 常见错误码：30002 无项目权限；10003 token 失效；11xxx 资源不存在/校验失败
        if (code == 30002) {
          throw new BizException(403, "DolphinScheduler: " + msg);
        }
        if (code == 10003) {
          throw new BizException(401, "DolphinScheduler token 无效或已过期");
        }
        throw new BizException(502, "DolphinScheduler: " + msg);
      }
      return mapper.treeToValue(root.path("data"), Object.class);
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
