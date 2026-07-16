# syntax=docker/dockerfile:1.7

# ---------- builder ----------
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build
# 国内 Maven 镜像（阿里云）
COPY settings.xml /root/.m2/settings.xml
COPY pom.xml .
# 仅凭 pom 预热依赖到 BuildKit 缓存；无源码必然编译失败，用 || true 忽略
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q -DskipTests package > /dev/null 2>&1 || true
COPY src ./src
# ~/.m2 走 BuildKit 缓存，跨构建复用，改代码不再重下依赖
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q clean package -DskipTests

# ---------- runner ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /build/target/platform-service-*.jar app.jar
EXPOSE 8088
ENV JAVA_OPTS="-Xms256m -Xmx512m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
