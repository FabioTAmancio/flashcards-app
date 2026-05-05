# ── Etapa 1: build do projeto ─────────────────────────────
FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

# copia tudo
COPY . .

# gera o .jar
RUN mvn clean package -DskipTests


# ── Etapa 2: imagem final leve ────────────────────────────
FROM eclipse-temurin:21-jdk

WORKDIR /app

# copia só o .jar gerado
COPY --from=build /app/target/*.jar app.jar

# porta padrão do Spring
EXPOSE 8080

# comando de inicialização
ENTRYPOINT ["java", "-jar", "app.jar"]