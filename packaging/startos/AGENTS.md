# Package development

- Run npm and make from packaging/startos; the repository root package.json builds Terminus frontend assets.
- The application image builds ../../Dockerfile from the repository root. Keep packaging outputs excluded from the Docker context.
- Advance startos/versions/current.ts and preserve version migrations for updates. Database major upgrades require explicit migration support.
- Keep README.md and instructions.md aligned with runtime changes. Use the StartOS 0.4.0 SDK, not legacy YAML manifests.
