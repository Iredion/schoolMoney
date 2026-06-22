# ============================================================
# SchoolMoney Backend – Dockerfile
# Technologia: Spring Boot 3.5 / Java 21 / Gradle
# Multi-stage build: budowanie JAR + minimalizacja obrazu
# ============================================================

# ---------- Etap 1: budowanie aplikacji ----------
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Kopiowanie plików Gradle (cache warstw)
COPY gradlew gradlew.bat settings.gradle build.gradle ./
COPY gradle ./gradle

# Pobieranie zależności (oddzielna warstwa – cache)
RUN chmod +x ./gradlew && ./gradlew dependencies --no-daemon || true

# Kopiowanie kodu źródłowego i budowanie
COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

# ---------- Etap 2: obraz produkcyjny ----------
FROM eclipse-temurin:21-jre-alpine AS runtime

# Tworzenie użytkownika bez uprawnień root
RUN addgroup -S spring && adduser -S spring -G spring

WORKDIR /app

# Kopiowanie zbudowanego JAR-a
COPY --from=builder /app/build/libs/*.jar app.jar

# Folder na uploadowane pliki
RUN mkdir -p /app/uploads && chown spring:spring /app/uploads

USER spring

EXPOSE 8080

# Uruchomienie z profilem docker i zewnętrznym folderem uploads
ENTRYPOINT ["java", \
  "-Dspring.profiles.active=docker", \
  "-Dspring.data.mongodb.uri=${MONGO_URI}", \
  "-jar", "app.jar"]
