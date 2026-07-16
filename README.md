# FridgeAI — team Efficiency O(Ubahn)

Turn what's already in your fridge into something to cook. FridgeAI is a
university DevOps course project (org **AET-DevOps26**, repo
**team-efficiency-o-ubahn**): track your ingredients, set your dietary
preferences and allergies, and let a GenAI service generate a recipe from
exactly what you have on hand.

- **Inventory.** Add, update and remove the ingredients in your fridge (name, quantity, unit, expiry date).
- **Preferences.** Per-user diet focus and allergy list, applied to every AI generation.
- **AI recipes.** One click gathers your ingredients + preferences and asks the GenAI service for a full recipe (title, steps, prep time, nutrition, ingredient amounts).
- **Favourites.** Save and unsave recipes per user.
- **Auth.** Email/password registration and login with JWT; one shared signing secret validated by every service.

| Path | What's there |
|------|--------------|
| [`Client/`](Client) | React 19 + TypeScript web client (Vite). Served by nginx on port 80, which also reverse-proxies `/api/*` and the docs. |
| [`Server/user-service/`](Server/user-service) | Identity, registration, login, JWT issuance, dietary preferences. Port 8081, schema `user_service`. |
| [`Server/inventory-service/`](Server/inventory-service) | Fridge ingredient CRUD. Port 8082, schema `inventory_service`. |
| [`Server/recipe-service/`](Server/recipe-service) | Recipes, favourites, AI generation (orchestrates inventory + preferences + GenAI). Port 8083, schema `recipe_service`. |
| [`GenAI-Service/`](GenAI-Service) | Python FastAPI recipe generator (Logos cloud in prod, local Ollama in dev). Port 8084. |
| [`helm/fridgeai/`](helm/fridgeai) | Kubernetes Helm chart for AET cluster deployment. |
| [`infrastructure/`](infrastructure) | Terraform (Azure VM) + Ansible (Docker Compose deploy). |

## Architecture

A single-page web client talks to three Spring Boot REST microservices behind one
PostgreSQL instance (one database `fridgeai`, three schemas). In production the
client's nginx is the only entrypoint — it serves the SPA and reverse-proxies
`/api/*`, the Swagger UI, the per-service OpenAPI specs, and the GenAI docs to the
right service. **Only `user-service` issues JWTs**; inventory and recipe validate
them with the same shared `JWT_SECRET`. `recipe-service` is the orchestrator —
to generate a recipe it pulls the caller's ingredients from `inventory-service`
and preferences from `user-service` (internal endpoints), then calls
`genai-service`.

```
   Web client (SPA)        ┌──────────────────────────────────────────────┐
   Vite dev :5173          │  nginx (Client container, :80)                │
   nginx prod :80     ───► │  · serves SPA                                 │
                           │  · proxies /api/*, /swagger-ui*, /api-docs/*  │
                           │  · proxies /genai/*                           │
                           └───────────────┬──────────────────────────────┘
                                           │  Authorization: Bearer <JWT>
              ┌────────────────────────────┼───────────────────────────┐
              ▼                            ▼                            ▼
   ┌───────────────────┐      ┌───────────────────┐      ┌───────────────────────┐
   │   user-service    │      │ inventory-service │      │    recipe-service     │
   │      :8081        │      │      :8082        │      │        :8083          │
   │  /api/auth        │◄─────┤  /api/inventory   │◄─────┤  /api/recipes         │
   │  /api/users       │ pref │                   │ items│  (orchestrator;       │
   │  /api/preferences │      │  (validates JWT)  │      │   validates JWT)      │
   │  ISSUES JWT       │      └─────────┬─────────┘      └───────────┬───────────┘
   └─────────┬─────────┘                │                            │
             │  shared JWT_SECRET       │              POST /api/genai/generate-recipe
             │  (validate)              ▼                            ▼
             │                ┌──────────────────────────────────────────────────┐
             │                │   genai-service  :8084  (FastAPI)                 │
             │                │   OpenAI-compatible LLM                           │
             │                │   · cloud: Logos (openai/gpt-oss-120b)            │
             │                │   · local: Ollama / llama.cpp                     │
             │                └──────────────────────────────────────────────────┘
             ▼                          ▼                            ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │  PostgreSQL 16  (DB: fridgeai)   schemas: user_service | inventory_service │
   │  :5432                                            | recipe_service          │
   └──────────────────────────────────────────────────────────────────────────┘
```

## Tech stack

| Layer | Technology |
|-------|-----------|
| Web client | React 19, TypeScript 6, Vite 8, nginx (prod) |
| Backend services | Java 21, Spring Boot (Web MVC, Data JPA, Security), Gradle |
| Auth | JWT (JJWT), BCrypt, shared `JWT_SECRET` |
| Persistence | PostgreSQL 16, schema-per-service, Hibernate `ddl-auto=update` |
| GenAI service | Python 3.12, FastAPI, uvicorn, `openai` SDK (OpenAI-compatible) |
| LLM provider | Logos cloud (`openai/gpt-oss-120b`) in prod; local Ollama/llama.cpp in dev |
| API docs | springdoc-openapi (aggregated Swagger UI) per Spring service; FastAPI docs for GenAI |
| Infra / CI | Docker Compose, Helm v3, Kubernetes (AET cluster), Terraform + Ansible (Azure VM), GitHub Actions, GHCR |

## Quick start (Docker Compose)

Brings up Postgres + the three Spring services + the GenAI service + the web
client (nginx) on one machine. Requires Docker + Docker Compose v2.

```bash
# From the repo root:
# (override defaults via a .env file: POSTGRES_PASSWORD, JWT_SECRET, LOGOS_API_KEY)
docker compose up -d
```

The app opens at **http://localhost** (the client nginx on port 80). All API
calls and the docs are proxied through it.

> `docker-compose.override.yml` is auto-merged and **builds the images from local
> source** instead of pulling the pre-built `:latest` images from GHCR, so local
> code changes show up. It also publishes `genai-service` directly on `:8084` for
> debugging. The override never ships to production (Ansible copies only
> `docker-compose.yml`).

**GenAI provider.** The GenAI service speaks the OpenAI-compatible API for both
backends, so switching is a single env var (`GENAI_PROVIDER=cloud|local`):

- **cloud** (default) → Logos at `https://logos.aet.cit.tum.de/v1`, model `openai/gpt-oss-120b`. Needs `LOGOS_API_KEY` and is only reachable from the TUM network (use eduVPN off-campus).
- **local** → point `LOCAL_BASE_URL` / `LOCAL_MODEL` at e.g. Ollama on `http://localhost:11434/v1`.

See [`GenAI-Service/README.md`](GenAI-Service/README.md) for the full GenAI guide.

## Testing

**Client** — Vitest + React Testing Library, jsdom environment.

```bash
cd Client
npm ci
npm run test        # run once (also what CI runs)
npx vitest           # watch mode
```

Tests live alongside the code they cover (`Client/src/**/*.test.tsx`), with
setup in [`Client/src/setupTests.ts`](Client/src/setupTests.ts). CI (`ci.yml`)
runs `npm run test` before `npm run build` on every PR and push to `main`.

**Server** — JUnit 5 via Spring Boot's test starter, one Gradle module per
service.

```bash
cd Server
./gradlew :user-service:test
./gradlew :inventory-service:test
./gradlew :recipe-service:test
# or all three:
./gradlew test
```

Tests live under each service's `src/test/java/...` (e.g.
[`user-service/src/test/java/com/fridgeai/user`](Server/user-service/src/test/java/com/fridgeai/user)),
covering controllers, services, JWT filter/util. CI runs
`./gradlew :<service>:test` before `bootJar` for each service, in parallel.

**GenAI-Service** — pytest.

```bash
cd GenAI-Service
pip install -r requirements-dev.txt
pytest -v
```

Tests live in [`GenAI-Service/tests/`](GenAI-Service/tests), with shared
fixtures in [`conftest.py`](GenAI-Service/conftest.py). CI runs `pytest -v`,
then a smoke import of `app.main` to confirm the app boots.

## API reference

All Spring endpoints are served under the `/api` prefix; everything except
registration, login, health and the Swagger/OpenAPI routes requires
`Authorization: Bearer <JWT>`. The `internal/*` endpoints are for
service-to-service calls only.

### user-service (`:8081`)
| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/api/auth/register` | Create user + default preferences, returns JWT; public (409 if email taken) |
| `POST` | `/api/auth/login` | Authenticate, returns JWT; public (401 on bad creds) |
| `GET` | `/api/preferences/me` | Current user's diet focus + allergies |
| `PUT` | `/api/preferences/me` | Replace current user's preferences |
| `GET` | `/api/preferences/internal/{email}` | Internal lookup used by recipe-service |
| `GET` | `/api/health` | Liveness |

### inventory-service (`:8082`)
| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/inventory` | List the caller's fridge ingredients |
| `POST` | `/api/inventory/items` | Add an ingredient |
| `PUT` | `/api/inventory/items/{id}` | Update an ingredient |
| `DELETE` | `/api/inventory/items/{id}` | Delete an ingredient (204) |
| `GET` | `/api/inventory/internal/{userEmail}` | Internal lookup used by recipe-service |

### recipe-service (`:8083`)
| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/recipes` | List all stored recipes |
| `GET` | `/api/recipes/{id}` | Get one recipe |
| `POST` | `/api/recipes` | Create a recipe directly (seed/test use) |
| `POST` | `/api/recipes/generate` | Gather caller's ingredients + preferences and generate via GenAI (502 if GenAI down) |
| `GET` | `/api/recipes/favourites` | List the caller's favourites |
| `POST` | `/api/recipes/{id}/favourite` | Add a favourite |
| `DELETE` | `/api/recipes/{id}/favourite` | Remove a favourite (204) |

### genai-service (`:8084`)
| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/health` | Readiness (`{status, provider, model}`) |
| `POST` | `/api/genai/generate-recipe` | `{ ingredients, preferences }` → `GeneratedRecipe` (title, instructions, prepTimeMinutes, nutritionInfo, ingredients) |

## OpenAPI / Swagger

The three Spring services expose springdoc OpenAPI, and `user-service` hosts a
**single aggregated Swagger UI** with a dropdown to switch between the
`user-service`, `inventory-service` and `recipe-service` specs. The client's
nginx proxies all of these, so in any deployment the docs live at the **same
origin** as the app:

| What | Path (relative to the app origin) |
|------|-----------------------------------|
| Aggregated Swagger UI | `/swagger-ui.html` |
| Swagger UI assets | `/swagger-ui/` |
| Spec discovery config | `/v3/api-docs/swagger-config` |
| user-service OpenAPI spec | `/api-docs/user` |
| inventory-service OpenAPI spec | `/api-docs/inventory` |
| recipe-service OpenAPI spec | `/api-docs/recipe` |
| GenAI Swagger UI (FastAPI) | `/genai/docs` |
| GenAI ReDoc | `/genai/redoc` |
| GenAI OpenAPI spec | `/genai/openapi.json` |

### Local (via the client on `http://localhost`)
- Swagger UI — <http://localhost/swagger-ui.html>
- GenAI docs — <http://localhost/genai/docs>

Or hit a service directly on its own port (when published), e.g.
<http://localhost:8081/swagger-ui.html> and <http://localhost:8084/genai/docs>.

### Production

The app and all docs are served behind the client nginx, so just append the
paths above to the base URL.

**Azure VM** — base URL **http://135.225.128.167**

| Resource | Link |
|----------|------|
| App | <http://135.225.128.167> |
| Swagger UI | <http://135.225.128.167/swagger-ui.html> |
| GenAI docs | <http://135.225.128.167/genai/docs> |

**AET Kubernetes** — base URL **https://ge48yep-devops-ss26.stud.k8s.aet.cit.tum.de**

| Resource | Link |
|----------|------|
| App | <https://ge48yep-devops-ss26.stud.k8s.aet.cit.tum.de> |
| Swagger UI | <https://ge48yep-devops-ss26.stud.k8s.aet.cit.tum.de/swagger-ui.html> |
| GenAI docs | <https://ge48yep-devops-ss26.stud.k8s.aet.cit.tum.de/genai/docs> |

## Configuration

### Shared / Postgres
| Variable | Default | Purpose |
|----------|---------|---------|
| `POSTGRES_DB` | `fridgeai` | Database name |
| `POSTGRES_USER` | `fridgeai` | DB user |
| `POSTGRES_PASSWORD` | `fridgeai` (dev) | DB password — **override in prod** |
| `JWT_SECRET` | dev placeholder (min 32 chars) | HMAC secret shared by all Spring services — **override in prod** |
| `IMAGE_TAG` | `latest` | GHCR image tag pulled by Compose (CI sets the commit SHA) |

### Spring services
| Variable | Default | Purpose |
|----------|---------|---------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/fridgeai` | JDBC URL (schema is set per service) |
| `SPRING_DATASOURCE_USERNAME` / `_PASSWORD` | `fridgeai` / `fridgeai` | DB creds |
| `INVENTORY_SERVICE_URL` | `http://inventory-service:8082` | recipe → inventory base URL |
| `USER_SERVICE_URL` | `http://user-service:8081` | recipe → user base URL |
| `GENAI_SERVICE_URL` | `http://genai-service:8084` | recipe → genai base URL |

### GenAI service ([`GenAI-Service/.env.example`](GenAI-Service/.env.example))
| Variable | Default | Purpose |
|----------|---------|---------|
| `GENAI_PROVIDER` | `cloud` | `cloud` (Logos) \| `local` |
| `LOGOS_API_KEY` / `LOGOS_BASE_URL` / `LOGOS_MODEL` | `lg-replace-me` / `https://logos.aet.cit.tum.de/v1` / `openai/gpt-oss-120b` | Cloud provider config |
| `LOCAL_BASE_URL` / `LOCAL_MODEL` | `http://localhost:11434/v1` / `llama3` | Local provider config |
| `GENAI_PORT` | `8084` | Server port |

## Deployment & CI/CD

GitHub Actions workflows in [`.github/workflows/`](.github/workflows/):

- **`ci.yml`** — on every PR and push to `main`: builds each Spring service (`gradlew bootJar`, JDK 21), the client (`npm run build`, Node 22), and smoke-imports the GenAI service (Python 3.12).
- **`build-images.yml`** — builds the five service images and pushes them to GHCR, tagged by commit SHA.
- **`deploy-aet.yml`** — auto-runs after a successful image build on `main`; `helm upgrade --install` to the AET cluster (namespace **`ge48yep-devops26`**, values `values-aet.yaml`, image tag = commit SHA).
- **`deploy.yml`** — deploys to the Azure VM via Ansible (installs Docker, copies `docker-compose.yml`, pulls GHCR images, `docker compose up -d`).

### AET Kubernetes (Helm)
The chart [`helm/fridgeai/`](helm/fridgeai/) (release `fridgeai`) deploys to
namespace **`ge48yep-devops26`** with an nginx **Ingress** routing `/` to the
client on port 80 and **cert-manager** TLS (cluster-issuer `letsencrypt-prod`,
secret `fridgeai-tls`). Ingress host:
`ge48yep-devops-ss26.stud.k8s.aet.cit.tum.de`. Images come from
`ghcr.io/aet-devops26/team-efficiency-o-ubahn/*`.

```bash
# pull secret for the private GHCR packages
kubectl create secret docker-registry ghcr-pull-secret \
  --docker-server=ghcr.io --docker-username=<user> --docker-password=<token> \
  -n ge48yep-devops26

helm upgrade --install fridgeai ./helm/fridgeai \
  --namespace ge48yep-devops26 \
  -f helm/fridgeai/values-aet.yaml \
  --set image.tag=<sha> \
  --set-string secrets.jwtSecret=<secret> \
  --set-string secrets.postgresPassword=<pw> \
  --set-string secrets.logosApiKey=<key>
```

### Azure VM (Docker Compose, IP `135.225.128.167`)
```bash
# 1. provision the VM (one-time, local)
cd infrastructure/terraform
terraform init
terraform apply

# 2. configure + deploy (CI runs this automatically)
ansible-playbook -i infrastructure/ansible/inventory.ini \
  infrastructure/ansible/playbook.yml
```
The playbook installs Docker, copies `docker-compose.yml`, logs in to GHCR, and
runs `docker compose up -d`. The client nginx then serves the app on port 80 at
**http://135.225.128.167** (Postgres is not published externally).

> **Security note:** the default `JWT_SECRET`, `POSTGRES_PASSWORD`, Helm
> `secrets.jwtSecret` / `secrets.postgresPassword`, and `LOGOS_API_KEY` are
> placeholders and must be overridden for any real deployment.

## Docs

| Document | Description |
|----------|-------------|
| [Problem Statement](problem-statement.md) | Product vision and user scenarios |
| [System Structure](system-structure.md) | Service breakdown and architecture |
| [Backlog](backlog.md) | Planned work |
