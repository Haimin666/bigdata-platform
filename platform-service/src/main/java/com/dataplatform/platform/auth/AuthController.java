package com.dataplatform.platform.auth;

import com.dataplatform.platform.auth.dto.LoginRequest;
import com.dataplatform.platform.auth.dto.LoginResponse;
import com.dataplatform.platform.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/platform/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
    return ApiResponse.ok(authService.login(req.username(), req.password()));
  }

  @GetMapping("/me")
  public ApiResponse<Map<String, Object>> me() {
    User u = authService.currentUser();
    return ApiResponse.ok(Map.of(
        "username", u.getUsername(),
        "displayName", u.getDisplayName() == null ? "" : u.getDisplayName(),
        "isAdmin", u.isAdmin()));
  }
}
