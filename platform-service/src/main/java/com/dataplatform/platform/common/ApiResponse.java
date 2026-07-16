package com.dataplatform.platform.common;

/**
 * 统一响应信封。status=0 表示成功，与 DSS/Linkis 风格保持一致，便于前端复用解包逻辑。
 */
public record ApiResponse<T>(int status, String message, T data) {

  public static <T> ApiResponse<T> ok(T data) {
    return new ApiResponse<>(0, "ok", data);
  }

  public static <T> ApiResponse<T> ok() {
    return new ApiResponse<>(0, "ok", null);
  }

  public static <T> ApiResponse<T> fail(int status, String message) {
    return new ApiResponse<>(status, message, null);
  }
}
