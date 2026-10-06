# Terminus for StartOS 0.4.0

This package builds the Terminus source in this checkout, with PostgreSQL 18.6 and Valkey 9.1 sidecars. Web and Sidekiq run as uid 1000; PostgreSQL and Valkey bind only to loopback. The public HTTP interface listens on port 2300. There are no external StartOS package dependencies.

## Build

Requires Docker, Node.js 22 or newer, npm, make, jq, and start-cli 2.x. Initialize a packaging workspace containing this checkout before building (`start-cli s9pk init-workspace` in its parent). The CLI requires a workspace with `.startos/config.yaml` and a build key.

Docker must use a builder supporting Docker archive exports. If the default driver rejects exports, create one with `docker buildx create --name terminus-startos --driver docker-container` and prefix make with `BUILDX_BUILDER=terminus-startos`.

```sh
cd packaging/startos
npm ci
make arm         # ARM64
make x86         # Intel/AMD
make universal   # Both architectures in one archive
```

SDK 2.0.9 declares StartOS `0.4.0-beta.10` compatibility. Sideload the resulting `.s9pk` into a compatible StartOS 0.4.0 server. Runtime installation and backup/restore should be verified on a StartOS server before distributing the package.

The package version is 0.76.0:0, based on this checkout (0.76.0 plus subsequent commits). The Docker build uses local source, not a floating application image. Review and advance the version graph when updating Terminus; PostgreSQL major upgrades need a migration plan.

## Storage and startup

| Volume | Contents |
| --- | --- |
| main | Persisted application secret, database and Valkey passwords, device URL override |
| postgres | PostgreSQL 18 data under /var/lib/postgresql/18/docker |
| valkey | Valkey AOF and queued jobs |
| fonts | Shared downloaded fonts |
| uploads | Shared rendered screens and uploaded files |
| assets | Shared compiled assets, regenerated at startup, excluded from backups |

Startup waits for database/cache readiness, fixes application volume ownership, compiles assets, migrates the schema, starts Puma, then starts Sidekiq. Failures in asset compilation or migration prevent the app from starting. Web readiness uses /up; worker readiness checks the Sidekiq process title through Ruby and /proc.

## Configuration and networking

Internal credentials are generated once on installation and restored with backups. The Set Device Server URL action validates an HTTP(S) origin and restarts the running service through a reactive file read. With no override, API_URI comes from the published Web UI address. Physical displays must be able to resolve and reach that URL. The first registered user gets full access, matching upstream behavior.

## Backups

The SDK PostgreSQL dump/restore helper handles the database; main, Valkey, fonts, and uploads are backed up as volumes. Restore rebuilds PostgreSQL with the persisted password. Generated assets are recompiled. Do not restore the database without its matching main volume.

## Limitations

No Compose certificate installer or device URL discovery wizard is included. Synchronizers and network extensions retain upstream Internet requirements. Physical devices generally cannot use onion addresses. Budget several GB of RAM for Chromium rendering, the database, web, and worker.

## Documentation

- [Terminus](https://github.com/usetrmnl/terminus)
- [StartOS packaging guide](https://docs.start9.com/packaging/0.4.0.x/)
