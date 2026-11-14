# Task Manager Backend

Minimal REST API for managing tasks, built with Java 21, Spring Boot, Spring Data JPA, and MySQL 8.

## Requirements

- Java 21
- MySQL 8

## Run locally with Maven

MySQL must be installed and running directly on your operating system. Docker
and Docker Compose are not required for local development.

1. Create the database in your local MySQL installation:

   ```sql
   CREATE DATABASE task_manager;
   ```

2. Copy `.env.example` to `.env` and set `DB_HOST`, `DB_PORT`, `DB_NAME`,
   `DB_USERNAME`, and `DB_PASSWORD`. Load the values into your shell before
   starting the application:

   ```bash
   set -a
   source .env
   set +a
   ```

   You can also export the variables individually instead of using `.env`.
   The application connects to MySQL using `application.properties`; credentials
   are not stored in the repository.

3. Start the backend directly with Maven:

   ```bash
   mvn spring-boot:run
   ```

   The API starts at `http://localhost:8080`. Hibernate uses
   `ddl-auto=update` to update the development schema automatically.

4. Build the executable JAR when needed:

   ```bash
   mvn clean package
   java -jar target/task-manager-0.0.1-SNAPSHOT.jar
   ```

## Test the API without Docker

With the backend running, check its health:

```bash
curl http://localhost:8080/api/health
```

Create a task:

```bash
curl -X POST http://localhost:8080/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Set up the project","status":"TODO"}'
```

List tasks:

```bash
curl http://localhost:8080/api/tasks
```

Run the automated tests with Maven:

```bash
mvn test
```

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/tasks` | List tasks |
| GET | `/api/tasks/{id}` | Get one task |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/{id}` | Update a task |
| DELETE | `/api/tasks/{id}` | Delete a task |

Task JSON uses `title` (required), `description`, `status` (`TODO`,
`IN_PROGRESS`, or `DONE`), and `dueDate` (`YYYY-MM-DD`). New tasks default to
`TODO` when status is omitted.

Example request:

```json
{
  "title": "Set up the project",
  "description": "Configure the local environment",
  "status": "TODO",
  "dueDate": "2026-12-01"
}
```

The API allows CORS requests from `http://localhost:5173`.

## Optional Docker deployment

Docker is not part of the normal local development workflow. The Dockerfile is
provided only as an optional deployment artifact. Build the application first,
then build and run the image if Docker is available:

```bash
mvn clean package
docker build -t task-manager .
docker run --rm -p 8080:8080 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=3306 \
  -e DB_NAME=task_manager \
  -e DB_USERNAME=your_mysql_username \
  -e DB_PASSWORD=your_mysql_password \
  task-manager
```

## Deploy to Tomcat 10.1

The project is configured as a WAR for external Tomcat deployment. Build it
with Maven:

```bash
mvn clean package -DskipTests
```

Deploy `target/task-manager-1.0.war` to Tomcat 10.1's `webapps` directory.
Spring Boot 3 uses Jakarta Servlet APIs, so use Tomcat 10.1 rather than the
older Tomcat 9 or Tomcat 10.0 lines. Configure the `DB_*` environment
variables for the Tomcat process before starting the server.
