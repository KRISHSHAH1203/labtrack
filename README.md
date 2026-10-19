# LabTrack

A full-stack app for tracking lab study samples from receipt through analysis. Node.js and Express API with REST and GraphQL, a React frontend styled with SCSS, PostgreSQL storage, Prometheus metrics, OpenTelemetry tracing, and tests at every level.

**Stack:** Node.js 20, TypeScript, Express, GraphQL, React 18, Vite, SCSS, PostgreSQL, Jest, Supertest, React Testing Library, Playwright, Prometheus (prom-client), OpenTelemetry, Docker, Kubernetes, GitHub Actions.

## Run it

```bash
# API tests (15 tests, ~95% line coverage)
cd server && npm install && npm test

# Frontend tests
cd web && npm install && npm test

# End-to-end tests in a real browser
cd server && npm run build && cd ../web && npm run build
cd ../e2e && npm install && npx playwright install chromium && npx playwright test

# Everything together: app + Postgres + Prometheus
docker compose up --build
# App: http://localhost:3000   Metrics: http://localhost:3000/metrics   Prometheus: http://localhost:9090
```

Without `DATABASE_URL` the API falls back to in-memory storage, so it runs with zero setup.

## API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/samples` | Register a sample (`code`, `studyId`, `type`) |
| GET | `/api/samples?studyId=&status=&limit=&offset=` | Filtered, paginated list (max 100 per page) |
| GET | `/api/samples/:id` | One sample |
| PATCH | `/api/samples/:id/status` | Move a sample to the next status |
| POST | `/graphql` | `samples`, `sample` queries and the `advanceSample` mutation |
| GET | `/healthz` | Liveness and readiness probe |
| GET | `/metrics` | Prometheus metrics |

Workflow: `RECEIVED -> IN_ANALYSIS -> COMPLETED`, and either of the first two can go to `REJECTED`. Anything else returns 422.

## Design decisions (what to say in an interview)

**1. Layered architecture and SOLID.** Routes and GraphQL resolvers are thin. Business rules live in `SampleService`. Storage sits behind a `SampleRepository` interface with two implementations, in-memory and PostgreSQL. The service depends on the interface, not on Postgres (dependency inversion), which is why the tests run with no database.

**2. One set of rules for two APIs.** REST and GraphQL both call the same service, so the status workflow and validation can't drift apart. The allowed transitions are a single table in `domain/sample.ts`.

**3. Validation at the edge.** Every input goes through a `zod` schema before it reaches the service. Bad input returns a 400 with field-level details. A single error handler maps domain errors to 404, 409 and 422.

**4. Secure coding (DevSecOps).**
- `helmet` sets secure HTTP headers
- Request bodies are capped at 100 KB
- The API is rate limited
- SQL uses parameterised queries only, never string-built SQL
- The Docker image runs as a non-root user
- The Kubernetes pod has a read-only root filesystem and no privilege escalation
- CI runs `npm audit` and fails on high-severity vulnerabilities

**5. Observability.**
- **Prometheus:** request latency is recorded as a histogram by method, route and status, alongside a business counter for status changes and Node.js default metrics, all on `/metrics`.
- **OpenTelemetry:** traces HTTP, Express and pg calls automatically through `tracing.ts`, which is loaded before the app starts.

**6. Performance.** The main list query is backed by an index on `(study_id, created_at DESC)`, and page size is capped at 100.

**7. Frontend.** `SampleForm` and `SampleTable` are reusable components with no data fetching inside. `App` gets its API client injected, so tests pass in a fake. Every input has a label and errors use `role="alert"` for screen readers. Styling uses SCSS tokens, a mixin for focus rings and an `@each` loop to generate the status badge colours.

**8. Testing pyramid.**
- **Unit:** domain rules.
- **API:** Supertest against the real Express app, covering validation, conflicts, the workflow, pagination, rate limiting, GraphQL, metrics and security headers.
- **Component:** React Testing Library.
- **End to end:** Playwright drives a real browser against the built app.

## Project layout

```
server/   Express + TypeScript API (REST, GraphQL, metrics, tracing)
web/      React + Vite + SCSS frontend
e2e/      Playwright end-to-end tests
k8s/      Deployment and Service with probes, resource limits, Prometheus annotations
.github/  CI: tests, audit, e2e, Docker build
```

## Ideas to extend

- Authentication with JWT and role-based access (lab tech vs study director)
- Redis cache for the list endpoint
- Testcontainers to run API tests against real Postgres
- An audit log table recording who changed each sample's status
