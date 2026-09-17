# appdevops

## CI/CD pipeline

```
main → tests → build → GHCR → preprod → E2E tests → production
```

- **tests** (`.github/workflows/ci.yml`, on every push/PR): server unit +
  integration tests, client unit tests + build, and a local Docker build of
  all three images to catch Dockerfile breakage early.
- **build → GHCR** (`.github/workflows/cd.yml`, triggered only after CI
  succeeds on `main`): builds the `server`, `client` and `db` images and
  pushes them to `ghcr.io/<owner>/appdevops-{server,client,db}`, tagged with
  the short commit SHA and `latest`.
- **preprod**: the same images are deployed over SSH to the preprod server
  (`docker-compose.deploy.yml`, project `appdevops-preprod`).
- **E2E tests** (Playwright, in `e2e/`): run against the live preprod URL.
- **production**: only runs if E2E passes, and requires manual approval via
  the `production` GitHub Environment before deploying the exact same images
  to prod (`docker-compose.deploy.yml`, project `appdevops-prod`).

Preprod and production run pre-built images only — neither server ever runs
`docker build`; they just `pull` and `up -d` what CI already tested.

### One-time GitHub setup

**Environments** (Settings → Environments):
- `preprod` — optionally add its URL for the "View deployment" link.
- `production` — add **required reviewers** here; this is what makes the
  prod deploy wait for a human click even after E2E passes. Add its URL too.

**Repository variables** (Settings → Secrets and variables → Actions →
Variables):
- `PREPROD_URL` — e.g. `https://preprod.your-domain.example`
- `PRODUCTION_URL` — e.g. `https://your-domain.example`

**Repository secrets** (same page, Secrets tab):

| Secret | Purpose |
|---|---|
| `GHCR_TOKEN` | PAT with `read:packages` scope, used by each server to `docker login ghcr.io` and pull images |
| `PREPROD_SSH_HOST` / `PROD_SSH_HOST` | SSH host of each server |
| `PREPROD_SSH_USER` / `PROD_SSH_USER` | SSH user with Docker permissions |
| `PREPROD_SSH_KEY` / `PROD_SSH_KEY` | Private key for that user |
| `PREPROD_SSH_PORT` / `PROD_SSH_PORT` | Optional, defaults to 22 |
| `PREPROD_DEPLOY_PATH` / `PROD_DEPLOY_PATH` | Absolute path on the server containing `docker-compose.deploy.yml` and its `.env.preprod` / `.env.prod` |

### One-time server setup (each of preprod and prod)

```bash
mkdir -p /opt/appdevops && cd /opt/appdevops
# copy docker-compose.deploy.yml here (it's the only file the server needs)
cp deploy/.env.deploy.example .env.preprod   # or .env.prod
# edit .env.preprod / .env.prod with real passwords, ports, CLIENT_ORIGIN
```

The very first deploy for each environment happens automatically the next
time `cd.yml` runs (push to `main`); after that, every merge to `main`
rolls forward through preprod → E2E → (approval) → prod automatically.
