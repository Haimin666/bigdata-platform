package com.dataplatform.platform.seed;

import com.dataplatform.platform.auth.User;
import com.dataplatform.platform.auth.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

  private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public void run(String... args) {
    if (userRepository.existsByUsername("admin")) {
      log.info("种子数据已存在，跳过初始化");
      return;
    }
    User admin = new User();
    admin.setUsername("admin");
    admin.setPassword(passwordEncoder.encode("admin123"));
    admin.setDisplayName("管理员");
    admin.setRole("ADMIN");
    userRepository.save(admin);

    log.info("种子数据初始化完成：admin/admin123");
  }
}
