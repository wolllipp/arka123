# Сборка и запуск API для хостинга (Render и любой Docker)
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src src
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar
# бесплатный инстанс — 512 МБ: куча в пределах контейнера, быстрый старт важнее пиковой скорости
ENV TZ=Europe/Minsk \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k"
EXPOSE 8090
CMD ["java", "-jar", "app.jar"]
