import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
export const current = VersionInfo.of({
  version: '0.76.0:1',
  releaseNotes: {
    en_US:
      'Use UTF-8 external and internal encodings for web and background screen builds, preserving existing Ruby options.',
  },
  migrations: { up: async () => {}, down: IMPOSSIBLE },
})
