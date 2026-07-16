package com.dataplatform.platform.auth.dto;

public record LoginResponse(String token, String username, String displayName, boolean isAdmin) {}
