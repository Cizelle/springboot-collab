# Use a JDK base image to build your application
FROM eclipse-temurin:17-jdk-alpine AS build

# Set the working directory
WORKDIR /app

# Copy the Maven wrapper and pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Copy the project source
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Use a clean, small image for the final runtime
FROM eclipse-temurin:17-jre-alpine

# Copy the built JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the port your application runs on
EXPOSE 8080

# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]