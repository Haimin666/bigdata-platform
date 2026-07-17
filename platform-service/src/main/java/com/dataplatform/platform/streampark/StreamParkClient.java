package com.dataplatform.platform.streampark;

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
import java.util.List;
import java.util.Map;

/**
 * StreamPark 2.x 适配客户端：仅封装只读端点（dashboard/project/env/cluster/team/app list），
 * 不触发任何 build/deploy/start/cancel 等写操作。认证用 Authorization 请求头（apiKey）。
 * StreamPark 信封 {code, msg, data}，code=200 成功（注意与 DS/OM 的 0 不同）。
 * teamId 由配置注入；app/list 参数以 form body（teamId=...）发送（query/JSON 都会 500）。
 */
@Component
public class StreamParkClient {

  private static final Logger log = LoggerFactory.getLogger(StreamParkClient.class);
  private static final TypeReference<List<Map<String, Object>>> LIST_MAP = new TypeReference<>() {};

  private final RestClient restClient;
  private final ObjectMapper mapper = new ObjectMapper();
  private final String baseUrl;
  private final String token;
  private final String teamId;

  public StreamParkClient(
      @Value("${platform.streampark.base-url:}") String baseUrl,
      @Value("${platform.streampark.token:}") String token,
      @Value("${platform.streampark.team-id:}") String teamId) {
    this.baseUrl = baseUrl == null ? "" : baseUrl.replaceAll("/+$", "");
    this.token = token == null ? "" : token;
    this.teamId = teamId == null ? "" : teamId;
    this.restClient = RestClient.builder().build();
  }

  public boolean configured() {
    return !baseUrl.isBlank() && !token.isBlank();
  }

  private void requireConfigured() {
    if (!configured()) {
      throw new BizException(503, "StreamPark 未配置（STREAMPARK_BASE_URL / STREAMPARK_TOKEN 缺失）");
    }
  }

  /** 实时集群总览：运行 job 数、slots、TM/JM 内存、task 状态分布。 */
  public Object dashboard() {
    requireConfigured();
    return request("/flink/app/dashboard?teamId=" + enc(teamId), null);
  }

  /** 团队下的项目列表（project/select）。方案 B：全量，形状由控制器包成 PageResult.full。 */
  public List<Map<String, Object>> projects() {
    requireConfigured();
    Object data = request("/flink/project/select?teamId=" + enc(teamId), null);
    return mapper.convertValue(data, LIST_MAP);
  }

  /** Flink 环境列表（env/list）。 */
  public List<Map<String, Object>> envs() {
    requireConfigured();
    Object data = request("/flink/env/list", null);
    return mapper.convertValue(data, LIST_MAP);
  }

  /** 集群列表（cluster/list）。 */
  public List<Map<String, Object>> clusters() {
    requireConfigured();
    Object data = request("/flink/cluster/list", null);
    return mapper.convertValue(data, LIST_MAP);
  }

  /** 团队列表（team/list）。 */
  public Object teams() {
    requireConfigured();
    return request("/team/list?team=%7B%7D&pageNum=1&pageSize=50", null);
  }

  /**
   * 应用列表（app/list），归一成统一 PageResult。StreamPark data = MyBatis-Plus 分页
   * {records, total, current, size, pages}。form body 传 teamId（query/JSON 会 500）。
   */
  public PageResult<Map<String, Object>> apps(int pageNum, int pageSize) {
    requireConfigured();
    String path = "/flink/app/list?pageNum=" + pageNum + "&pageSize=" + pageSize;
    JsonNode data = requestNode(path, "teamId=" + enc(teamId));
    List<Map<String, Object>> records = mapper.convertValue(data.path("records"), LIST_MAP);
    long total = data.path("total").asLong(0);
    int page = data.path("current").asInt(pageNum);
    int totalPage = data.path("pages").asInt(0);
    return new PageResult<>(records, total, page, pageSize, totalPage);
  }

  /** 返回 data 节点（JsonNode），供分页端点抽取 records/total 等。 */
  private JsonNode requestNode(String pathWithQuery, String formBody) {
    requireConfigured();
    URI uri = URI.create(baseUrl + pathWithQuery);
    try {
      RestClient.RequestBodySpec spec = restClient.method(HttpMethod.POST).uri(uri)
          .header(HttpHeaders.AUTHORIZATION, token);
      if (formBody != null) {
        spec.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE).body(formBody);
      } else {
        spec.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
      }
      String resp = spec.retrieve().body(String.class);
      JsonNode root = mapper.readTree(resp);
      int code = root.path("code").asInt(-1);
      if (code != 200) {
        throw new BizException(502, "StreamPark: " + root.path("msg").asText("unknown error"));
      }
      return root.path("data");
    } catch (HttpClientErrorException.Unauthorized e) {
      log.warn("StreamPark token 无效或已过期（{}）: {}", pathWithQuery, e.getMessage());
      throw new BizException(401, "StreamPark token 无效或已过期");
    } catch (HttpClientErrorException.Forbidden e) {
      throw new BizException(403, "StreamPark token 权限不足");
    } catch (BizException e) {
      throw e;
    } catch (Exception e) {
      log.warn("StreamPark 调用失败 {}: {}", pathWithQuery, e.getMessage());
      throw new BizException(502, "StreamPark 不可达: " + e.getMessage());
    }
  }

  /** 便捷：返回 data 转成 Object。 */
  private Object request(String pathWithQuery, String formBody) {
    JsonNode n = requestNode(pathWithQuery, formBody);
    try {
      return mapper.treeToValue(n, Object.class);
    } catch (Exception e) {
      return n;
    }
  }

  private String enc(String v) {
    return URLEncoder.encode(v == null ? "" : v, StandardCharsets.UTF_8);
  }
}

