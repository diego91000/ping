# PING — AccessDev Lab

Accessible web IDE prototype: Java/Quarkus REST backend + React/TypeScript frontend with voice-driven code editing. EPITA group project — 1st year cycle ingénieur (2026).

## Description

Prototype of an inclusive IDE for developers with motor disabilities, usable without conventional keyboard/mouse interaction. The frontend provides a Monaco-based code editor, a file explorer, a Python execution console and a voice command panel (Web Speech API); every action produces visible and/or spoken feedback. The backend exposes a REST API for user management, workspace file operations and code execution, secured with JWT.

The backend handles:
- user CRUD with role-based access (admin/user), JWT login and refresh
- file and folder CRUD scoped to a sandboxed workspace (path-traversal checks on every resolved path)
- Python file execution with stdout/stderr/exit-code capture and a 5-second timeout
- PostgreSQL persistence (users, saved file contents)

The frontend handles:
- file explorer, tabbed Monaco editor, execution console, activity log
- voice commands parsed into file/code operations, with speech-synthesis confirmation
- show/hide and resizable panels to adapt the interface to the user's needs

## ⚠️ Project Status

Functional prototype. The full login-edit-save-run cycle works end to end (login page, explorer, editor, voice commands, Python execution). Some pitch items were deliberately scoped out: eye-tracking control is not implemented and execution is limited to Python.

## Tech Stack

- Backend: Java 21, Quarkus 3.17, Hibernate ORM, PostgreSQL 16, Maven
- Frontend: React 19, TypeScript, Vite, Monaco Editor, Web Speech API
- Tests: JUnit/RestAssured (backend), Vitest (frontend)
- Infra: Docker, docker-compose, GitLab CI

## Architecture

Backend (`src/main/java/fr/epita/assistants/ping/`), layered:
- `presentation/rest/` — REST endpoints (users, files, folders, exec)
- `presentation/api/` — request/response DTOs
- `domain/service/` — business logic (auth, users, files, folders, execution)
- `data/model/`, `data/repository/` — JPA models and database access
- `utils/` — JWT, secure path resolution, hashing, logging
- `errors/` — centralized HTTP error codes and JSON error format

Frontend (`front/src/`):
- `pages/`, `components/` — React UI (atomic design: atoms/molecules)
- `lib/commands/` — voice command parser (file and code commands, spoken numbers)
- `api/` — typed REST client
- `store/`, `hooks/` — state and speech-recognition hooks

## Build

```bash
mvn package -DskipTests                    # backend
cd front && npm install && npm run build   # frontend
```

## Run / Usage

Quick start (PostgreSQL container + backend on :8080 + frontend on :5173):

```bash
./run.sh
```

Then open `http://localhost:5173` and log in with the demo account seeded at startup:

```text
login:    admin.root
password: adminpwd
```

Manual backend:

```bash
docker run -d --name ping-db -e POSTGRES_DB=ping -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
export FILESYSTEM_DEFAULT_PATH="$HOME/ping-workspace" && mkdir -p "$FILESYSTEM_DEFAULT_PATH"
mvn -q package -DskipTests
java -jar target/quarkus-app/quarkus-run.jar
```

Backend alone can also run with `docker compose up`. Swagger UI: `http://localhost:8080/q/swagger-ui`.

Tests:

```bash
./test.sh    # backend (Maven) + frontend (Vitest)
```

## Features (Implemented)

- JWT authentication (login, refresh) with admin/user roles
- User management endpoints (create, read, update, delete, list) — admin only where relevant
- File and folder CRUD, move/rename, recursive listing, upload — all confined to the workspace root
- Python execution endpoint returning stdout, stderr and exit code, 5 s timeout
- Voice commands: navigation, file operations and code edits, with spoken confirmation
- Resizable/hideable panels, responsive layout
- Backend and frontend test suites wired into GitLab CI

## Features (Incomplete / TODO)

- Eye-tracking control (voice control was prioritized)
- Execution of languages other than Python
- Persistent per-user UI preferences

## Project Structure

```
ping/
├── front/                  # React / TypeScript / Vite frontend
│   └── src/
│       ├── api/            # REST client
│       ├── components/     # UI components (atoms, molecules, ...)
│       ├── lib/commands/   # voice command parsing
│       └── pages/          # Login, Editor
├── src/
│   ├── main/java/fr/epita/assistants/ping/   # Quarkus backend (layers above)
│   ├── main/resources/     # application.properties, JWT keys, OpenAPI spec
│   └── test/java/          # backend tests
├── Dockerfile              # multi-stage backend image (non-root user)
├── docker-compose.yml      # PostgreSQL + backend
├── run.sh                  # local dev launcher
└── test.sh                 # full test suite (used by CI)
```

## Notes

- The project is an EPITA group assignment (1st year cycle ingénieur, 2026).
- The subject PDF is not included due to EPITA copyright restrictions.
- The committed JWT key pair and the `admin.root` credentials are demo values for local use only.

## Author

Diego Moreira — diegomoreira91000@gmail.com
