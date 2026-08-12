# Eduvia — Student Management Dashboard (Backend)

Backend service for the Student Management Dashboard technical assignment,
built with **NestJS**, **TypeORM**, and **PostgreSQL**.

## 1. Project Overview

This service exposes a REST API for managing students: creating, listing
(with search/filter/sort/pagination), viewing, updating, and deleting
student records. It follows Nest's module/controller/service layering
(a lightweight clean-architecture split) so each concern lives in its
own file:

- **`students.controller.ts`** — HTTP layer only: routes, params, status codes.
- **`students.service.ts`** — business logic: querying, validation of
  business rules (e.g. duplicate email), orchestration.
- **`entities/student.entity.ts`** — persistence model (TypeORM entity).
- **`dto/*`** — input validation and shaping, kept separate from the entity
  so the API contract and the database schema can evolve independently.
- **`common/filters/`** — a single global exception filter so TypeORM/HTTP
  errors are turned into the right status code in one place instead of
  being handled ad hoc in every controller.
- **`database/migrations/`** — versioned schema changes (no `synchronize`
  in real usage — see below).

Successful responses are returned as plain JSON — a student object, an
array, or `{ data, meta }` for the paginated list — matching what the API
spec (section 9) describes, without an extra wrapper layer. Errors follow
Nest's standard shape:

```json
{ "statusCode": 404, "message": "Student with id \"...\" was not found.", "error": "Not Found", "path": "...", "timestamp": "..." }
```

### API base URL

`http://localhost:4000/api/students`
Interactive API docs (Swagger): `http://localhost:4000/docs`

### Endpoints

| Method | Path                      | Auth required | Description                              |
| ------ | ------------------------- | :-----------: | ----------------------------------------- |
| POST   | `/api/auth/login`         |      No       | Log in, returns `{ accessToken, user }`   |
| GET    | `/api/auth/me`            |     Yes       | Returns the caller's identity for the given token |
| GET    | `/api/students`           |     Yes       | List students (search, filter, sort, paginate) |
| GET    | `/api/students/:id`       |     Yes       | Get one student                           |
| POST   | `/api/students`           |     Yes       | Create a student                          |
| PATCH  | `/api/students/:id`       |     Yes       | Update a student                          |
| DELETE | `/api/students/:id`       |     Yes       | Delete a student                          |
| GET    | `/api/students/meta/classes` |   Yes      | Distinct class values (for filter UI)  |
| GET    | `/api/health`             |      No       | Health check                              |

**Query params for `GET /students`:** `search`, `status` (`active`/`inactive`),
`class`, `page` (default 1), `limit` (default 10, max 100), `sortBy`
(`name` | `createdAt` | `class`), `sortOrder` (`ASC` | `DESC`).

### Authentication

Auth is a single admin account (bonus feature — the assignment marks auth
as out of scope, so this deliberately stops short of a full users table or
registration flow). Sign in with the credentials in `.env`
(`ADMIN_EMAIL` / `ADMIN_PASSWORD`, defaults below), then send the returned
token as `Authorization: Bearer <accessToken>` on every `/students` request.

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eduvia.com","password":"ChangeMe123!"}'

curl http://localhost:4000/api/students \
  -H "Authorization: Bearer <accessToken from above>"
```

Default local credentials (change `ADMIN_PASSWORD` and `JWT_SECRET` before
deploying anywhere): `admin@eduvia.com` / `ChangeMe123!`.

### Status codes

- `200` successful read/update/delete
- `201` successful create
- `400` validation error (bad payload/query)
- `401` missing/invalid/expired token, or wrong login credentials
- `404` student not found
- `409` duplicate email
- `500` unexpected server error

## 2. Requirements

- Node.js 18+ and npm 9+ (for running locally without Docker)
- **Docker & Docker Compose** (for running anywhere without installing Node/Postgres at all)
- A [Neon](https://neon.tech) Postgres project (free tier is enough) — or any Postgres 14+

## 3. Installation

```bash
npm install
```

## 4. Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable          | Description                                                        |
| ----------------- | -------------------------------------------------------------------- |
| `NODE_ENV`         | `development` \| `production` \| `test`                             |
| `PORT`             | Port the API listens on (default `4000`)                            |
| `API_PREFIX`       | Global route prefix (default `api`)                                 |
| `CORS_ORIGIN`      | Allowed frontend origin(s), comma-separated, or `*`                 |
| `DATABASE_URL`     | Neon connection string (takes priority over `DB_*` if set)          |
| `DB_SSL`           | `true`/`false` to force SSL on/off; auto-detected if unset (on for Neon, off for `localhost`) |
| `DB_HOST`          | Postgres host (used if `DATABASE_URL` is not set)                   |
| `DB_PORT`          | Postgres port                                                       |
| `DB_USERNAME`      | Postgres user                                                       |
| `DB_PASSWORD`      | Postgres password                                                   |
| `DB_NAME`          | Postgres database name                                              |
| `DB_SYNCHRONIZE`   | `true`/`false` — never enable in shared/production environments     |
| `JWT_SECRET`       | Secret used to sign/verify login tokens — **change before deploying** |
| `JWT_EXPIRES_IN`   | Token lifetime, e.g. `1d`                                            |
| `ADMIN_EMAIL`      | Login email for the single admin account                            |
| `ADMIN_PASSWORD`   | Login password for the single admin account — **change before deploying** |

No real credentials are committed; `.env` is git-ignored.

## 5. Database Setup (Neon)

1. Create a free project at [neon.tech](https://neon.tech).
2. In the Neon dashboard, open **Connection Details** and copy the
   **pooled connection string** (it already includes `?sslmode=require`).
3. Paste it into `.env` as `DATABASE_URL`.
4. Run the migration to create the `students` table:

   ```bash
   npm run migration:run
   ```

5. Optionally seed a few sample students:

   ```bash
   npm run seed
   ```

Don't have/want a Neon account? See the **Docker (local Postgres)** option
below — it spins up a throwaway Postgres container instead, no external
service required.

## 6. Running the Application

### Option A — locally with Node

```bash
npm run start:dev
```

### Option B — Docker, against Neon (recommended for handing this off)

This spins up both the API and a local Postgres container with a single
command — nothing else to install:

```bash
docker compose up --build
```

The API is available at `http://localhost:4000/api`, with Swagger docs at
`http://localhost:4000/docs`.

To stop and remove containers: `docker compose down` (add `-v` to also
drop the Postgres volume).

## 7. Available Scripts

| Script                     | Purpose                                          |
| --------------------------- | ------------------------------------------------- |
| `npm run start:dev`         | Start with hot-reload (development)               |
| `npm run build`             | Compile TypeScript to `dist/`                     |
| `npm run start:prod`        | Run the compiled build                            |
| `npm run migration:generate`| Generate a new migration from entity changes      |
| `npm run migration:run`     | Apply pending migrations (local, via ts-node)      |
| `npm run migration:run:prod`| Apply pending migrations against the compiled `dist/` build (run automatically on container start) |
| `npm run migration:revert`  | Roll back the last migration                      |
| `npm run seed`              | Insert sample student records                     |
| `npm test`                  | Run unit tests                                    |
| `npm run lint`              | Lint and auto-fix                                 |

## 8. Docker Notes

- **`Dockerfile`** is a multi-stage build: a `builder` stage installs all
  dependencies and compiles TypeScript, then a slim `production` stage
  copies only the compiled `dist/` and production `node_modules` into a
  fresh `node:20-alpine` image, running as a non-root user, with a
  built-in `HEALTHCHECK` against `/api/health`.
- The container's `CMD` runs pending migrations (`npm run migration:run:prod`)
  before starting the server, so `docker compose up` alone is enough to get
  a working schema on any machine. Set `RUN_MIGRATIONS_ON_BOOT=false` to
  skip this (e.g. if migrations are run as a separate CI/CD step instead).
- **`docker-compose.yml`** runs both the API and a local Postgres 16
  container together, so a reviewer can get the whole stack running with
  one command and no external database account.

## 9. Design Decisions & Notes

- **No `synchronize: true`** against the database, even locally by default —
  schema changes go through a migration file, which is what you'd want in
  any environment with real data or more than one developer.
- **DTO ≠ Entity**: request payloads are validated/shaped independently from
  the persistence model, so the API contract doesn't leak database details.
- **Global exception filter** turns TypeORM errors (e.g. Postgres unique
  violation `23505`) into a proper `409 Conflict` instead of a raw `500`.
- **Security/perf middleware**: `helmet` (secure headers), `compression`,
  and CORS restricted via `CORS_ORIGIN` — kept to inexpensive, low-risk
  defaults. No rate limiting or API versioning — deliberately kept out
  to match the "don't over-engineer" guidance in the assignment.
- **Pagination + sorting + case-insensitive search** implemented as a bonus,
  since a table UI is far more usable with them from day one.
- **Authentication** (bonus): JWT via `passport-jwt`, guarding every
  `/students` route with `JwtAuthGuard`. Deliberately a single admin
  account read from env vars rather than a users table/registration
  flow — the assignment marks auth as out of scope, so this adds real,
  working login without over-building a feature nobody asked for. The
  admin password is hashed with `bcrypt` before comparison; it is never
  stored or logged in plaintext beyond the local `.env` file.
- **Neon-ready by default**: SSL is inferred from the connection target
  (on for Neon/any remote host, off for `localhost`/the local Docker
  Postgres), with `DB_SSL` as an explicit override — the same DB config
  code path is used by the running app, the CLI migrations, and inside
  the Docker container.
- **Container is self-contained**: the entrypoint applies pending
  migrations before the server starts, so a fresh machine only needs
  `docker compose up` — no manual migration step.
- Not implemented (intentionally, to respect the "don't over-engineer"
  guidance): rate limiting, API versioning, soft-deletes, audit logs, a
  caching layer, a custom response envelope, and a full multi-user
  auth system (registration, roles, refresh tokens, password reset) —
  the single-admin JWT login covers the requested bonus without
  building a user-management feature the assignment doesn't call for.

## 10. Reflection

**What was the most challenging part of the assignment?**
Balancing "don't over-engineer" with genuinely solid backend practice —
deciding which production concerns (migrations, consistent error
handling, input validation) were worth including versus which (rate
limiting, versioning, a custom response envelope) were over-engineering
for the stated scope. The Docker/Neon setup added real infrastructure on
top of that trade-off, so keeping the application code itself lean
mattered even more.

**What technical decision are you most proud of?**
Centralizing error handling in a single global exception filter, so every
controller stays thin and every error response — validation, not-found,
duplicate email, or unexpected — has one predictable shape without extra
wrapping around successful responses.

**If you had another 4 hours, what would you improve?**
Add integration tests against a real (test) Postgres instance via
Testcontainers, request-level e2e tests for each endpoint, and cursor-based
pagination for large datasets.

**What part of the application would you change before deploying to production?**
Move past the single hardcoded admin account to real user accounts with
role-based authorization and refresh tokens, add structured request
logging with correlation IDs, and add a proper migrations-in-CI step so
schema and code always ship together. Rate limiting and API versioning
would also be worth revisiting at that point — deliberately left out
here, but genuinely useful once the API has real external consumers.