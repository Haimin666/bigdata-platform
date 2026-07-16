# ---------- builder ----------
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build
# 国内 Maven 镜像（阿里云）
COPY settings.xml /root/.m2/settings.xml
COPY pom.xml .
RUN mvn -B -q dependency:go-offline || true
COPY src ./src
RUN mvn -B -q clean package -DskipTests

# ---------- runner ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /build/target/platform-service-*.jar app.jar
EXPOSE 8088
ENV JAVA_OPTS="-Xms256m -Xmx512m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
