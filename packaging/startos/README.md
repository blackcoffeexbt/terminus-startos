# Terminus for StartOS 0.4.0

## Build the s9pk from a cloned repository

Install Docker (Docker Desktop on macOS), Node.js 22 or newer, npm, make, jq, Git, and **start-cli 2.x**. See the [Start9 environment setup guide](https://docs.start9.com/packaging/0.4.0.x/environment-setup.html) for installation instructions. Start Docker before building. The first universal build downloads dependencies and builds Chromium-based application images; allow approximately 20–25 GB of free disk space and an Internet connection.

Run the following from the root of your cloned repository. Replace the example path with your clone's location:

```sh
cd /path/to/terminus-startos

# One-time setup: create the Start9 workspace around the package directory.
# This creates packaging/.startos, a signing key, and the Start9 guide checkout.
start-cli s9pk init-workspace packaging

# One-time setup: use a builder that supports Docker archive exports.
# Skip creation if a builder named terminus-startos already exists.
docker buildx create --name terminus-startos --driver docker-container

# Install the package's pinned SDK and build dependencies.
cd packaging/startos
npm ci

# Build one archive containing ARM64 and Intel/AMD images.
BUILDX_BUILDER=terminus-startos make universal
```

The output is **`packaging/startos/terminus.s9pk`**, relative to the repository root. The build uses the Terminus source in this clone and bundles PostgreSQL and Valkey. You do not need to install Ruby, PostgreSQL, or Valkey on the build machine; Docker builds or downloads those dependencies.

To build only your server's architecture, replace the final command with one of these:

```sh
BUILDX_BUILDER=terminus-startos make arm  # terminus_aarch64.s9pk
BUILDX_BUILDER=terminus-startos make x86  # terminus_x86_64.s9pk
```

For later rebuilds, start in `packaging/startos`, run `npm ci` if dependencies changed, and repeat the desired build command. Keep the workspace's `.startos` directory and signing key outside version control. If you remove the builder, recreate it before rebuilding.

Inspect the universal archive and calculate its checksum with:

```sh
start-cli s9pk inspect terminus.s9pk manifest
shasum -a 256 terminus.s9pk
```

Sideload the archive through your StartOS server's web interface, then follow the service's Instructions tab. **SDK 2.0.9 targets StartOS `0.4.0-beta.10`.** Installation and backup/restore should be verified on a compatible StartOS server before distributing the package.

If Docker reports that its exporter is unsupported, confirm that the build command includes `BUILDX_BUILDER=terminus-startos`. If a build exhausts disk space, free space and restart Docker if it becomes unresponsive before retrying. After building, you can reclaim this builder's cache with `docker buildx rm terminus-startos`; the `.s9pk` remains available.

## Package overview

This package builds the Terminus source in this checkout, with PostgreSQL 18.6 and Valkey 9.1 sidecars. Web and Sidekiq run as uid 1000; PostgreSQL and Valkey bind only to loopback. The public HTTP interface listens on port 2300. There are no external StartOS package dependencies.

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
