package com.dataplatform.platform.auth;

import com.dataplatform.platform.auth.dto.LoginResponse;
import com.dataplatform.platform.common.BizException;
import com.dataplatform.platform.security.JwtUtil;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;

  public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtUtil = jwtUtil;
  }

  public LoginResponse login(String username, String password) {
    User user = userRepository
        .findByUsername(username)
        .orElseThrow(() -> new BizException(401, "用户名或密码错误"));
    if (!passwordEncoder.matches(password, user.getPassword())) {
      throw new BizException(401, "用户名或密码错误");
    }
    String token = jwtUtil.generate(user.getUsername());
    return new LoginResponse(token, user.getUsername(), user.getDisplayName(), user.isAdmin());
  }

  public User currentUser() {
    String username = SecurityContextHolder.getContext().getAuthentication().getName();
    return userRepository
        .findByUsername(username)
        .orElseThrow(() -> new BizException(401, "用户不存在"));
  }
}
