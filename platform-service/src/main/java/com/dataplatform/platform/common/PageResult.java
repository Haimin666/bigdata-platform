package com.dataplatform.platform.common;

import java.util.List;

/**
 * 统一分页结果。各外部组件的分页响应（DS 的 totalList、StreamPark 的 records、ES 的 hits）
 * 都由适配器归一成此结构，前端只认这一种分页形状。
 * page 从 1 起；totalPage 由 total/pageSize 计算（pageSize<=0 时按 1 处理避免除零）。
 */
public record PageResult<T>(List<T> records, long total, int page, int pageSize, int totalPage) {

  public static <T> PageResult<T> of(List<T> records, long total, int page, int pageSize) {
    int size = pageSize <= 0 ? 1 : pageSize;
    int totalPage = total <= 0 ? 0 : (int) Math.ceil((double) total / size);
    return new PageResult<>(records == null ? List.of() : records, total, page, pageSize, totalPage);
  }

  /** 全量返回但形状统一（方案 B：已知小列表一次性返回，total=records.size）。 */
  public static <T> PageResult<T> full(List<T> records) {
    List<T> r = records == null ? List.of() : records;
    return new PageResult<>(r, r.size(), 1, r.size(), 1);
  }
}
