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

No personal token is needed to pull images: the deploy jobs' built-in
`GITHUB_TOKEN` (already used to push in `build-and-push`) is passed to each
server over SSH to `docker login ghcr.io` for the `pull`, scoped read-only via
each job's `permissions: packages: read`. It's repo-scoped and expires with
the run, so it works for any contributor and never needs to be rotated by
hand.

| Secret | Purpose |
|---|---|
| `PREPROD_SSH_HOST` / `PROD_SSH_HOST` | SSH host of each server |
| `PREPROD_SSH_USER` / `PROD_SSH_USER` | SSH user with Docker permissions |
| `PREPROD_SSH_KEY` / `PROD_SSH_KEY` | Private key for that user |
| `PREPROD_SSH_PORT` / `PROD_SSH_PORT` | Optional, defaults to 22 |
| `PREPROD_DEPLOY_PATH` / `PROD_DEPLOY_PATH` | Absolute path to each environment's folder on the server, e.g. `/home/deploy/appdevops/preprod` and `/home/deploy/appdevops/prod` |

Both environments live on the same server, side by side, under one parent
folder:

```
~/appdevops/
├── preprod/
│   ├── docker-compose.deploy.yml   ← synced automatically by cd.yml
│   └── .env                        ← created by hand, never committed
└── prod/
    ├── docker-compose.deploy.yml   ← synced automatically by cd.yml
    └── .env                        ← created by hand, never committed
```

`docker-compose.deploy.yml` is a single file in this repo — the CD workflow
creates both folders (`mkdir -p`) and copies the same file into each of them
on every deploy, so nothing needs to be uploaded by hand and the server can
never drift from what's in git.

### One-time server setup (each of preprod and prod)

The folders and `docker-compose.deploy.yml` are created automatically on the
first run of `cd.yml`. The only manual step is the `.env` file, since it
holds secrets that must never be committed:

```bash
mkdir -p ~/appdevops/preprod ~/appdevops/prod   # optional: cd.yml creates these too
cp deploy/.env.deploy.example ~/appdevops/preprod/.env
cp deploy/.env.deploy.example ~/appdevops/prod/.env
# edit each .env with real passwords and, since both stacks share this
# server, a distinct CLIENT_PORT / SERVER_PORT / DB_PORT per environment
```

The very first deploy for each environment happens automatically the next
time `cd.yml` runs (push to `main`); after that, every merge to `main`
rolls forward through preprod → E2E → (approval) → prod automatically.
