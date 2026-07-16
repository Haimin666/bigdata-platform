package com.dataplatform.platform.common;

/** 业务异常，由 GlobalExceptionHandler 统一转成 ApiResponse。 */
public class BizException extends RuntimeException {
  private final int status;

  public BizException(String message) {
    this(1, message);
  }

  public BizException(int status, String message) {
    super(message);
    this.status = status;
  }

  public int status() {
    return status;
  }
}
