FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY . .

RUN mvn package -DskipTests

FROM eclipse-temurin:21-jre-alpine

# LABEL maintainer=""

RUN adduser --disabled-password -u 1000 NONROOT \
 && mkdir -p /tmp/ping \
 && chown NONROOT /tmp/ping

WORKDIR /app

COPY --from=build /app/target/quarkus-app/ /app/

USER NONROOT

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "quarkus-run.jar"]
