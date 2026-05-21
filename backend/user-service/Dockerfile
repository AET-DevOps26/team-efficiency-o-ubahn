# syntax=docker/dockerfile:1.6

# Build stage — runs from the backend/ build context so the Gradle multi-module
# build can resolve settings.gradle and the wrapper.
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace

COPY . .
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew && ./gradlew :user-service:bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /workspace/user-service/build/libs/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
