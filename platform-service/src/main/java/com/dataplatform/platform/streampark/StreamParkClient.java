package com.dataplatform.platform.streampark;

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

/**
 * StreamPark 2.x 适配客户端：仅封装只读端点（dashboard/project/env/cluster/team），
 * 不触发任何 build/deploy/start/cancel 等写操作。认证用 Authorization 请求头（apiKey）。
 * StreamPark 信封 {code, msg, data}，code=200 成功（注意与 DS/OM 的 0 不同）。
 * StreamPark 的 POST 查询端点参数走 query；teamId 由配置注入（app/dashboard、project/select 需要）。
 */
@Component
public class StreamParkClient {

  private static final Logger log = LoggerFactory.getLogger(StreamParkClient.class);

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
    return request("/flink/app/dashboard?teamId=" + enc(teamId));
  }

  /** 团队下的项目列表（project/select）。 */
  public Object projects() {
    requireConfigured();
    return request("/flink/project/select?teamId=" + enc(teamId));
  }

  /** Flink 环境列表（env/list）。 */
  public Object envs() {
    requireConfigured();
    return request("/flink/env/list");
  }

  /** 集群列表（cluster/list）。 */
  public Object clusters() {
    requireConfigured();
    return request("/flink/cluster/list");
  }

  /** 团队列表（team/list）。 */
  public Object teams() {
    requireConfigured();
    return request("/team/list?team=%7B%7D&pageNum=1&pageSize=50");
  }

  private Object request(String pathWithQuery) {
    URI uri = URI.create(baseUrl + pathWithQuery);
    try {
      String resp = restClient.method(HttpMethod.POST).uri(uri)
          .header(HttpHeaders.AUTHORIZATION, token)
          .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
          .retrieve()
          .body(String.class);
      JsonNode root = mapper.readTree(resp);
      int code = root.path("code").asInt(-1);
      if (code != 200) {
        throw new BizException(502, "StreamPark: " + root.path("msg").asText("unknown error"));
      }
      return mapper.treeToValue(root.path("data"), Object.class);
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

  private String enc(String v) {
    return URLEncoder.encode(v == null ? "" : v, StandardCharsets.UTF_8);
  }
}
