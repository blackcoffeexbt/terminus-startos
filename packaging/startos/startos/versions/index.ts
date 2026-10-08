import { IMPOSSIBLE, VersionGraph, VersionInfo } from '@start9labs/start-sdk'
import { current } from './current'

const initial = VersionInfo.of({
  version: '0.76.0:0',
  releaseNotes: { en_US: 'Initial StartOS 0.4.0 package.' },
  migrations: { up: async () => {}, down: IMPOSSIBLE },
})

export const versionGraph = VersionGraph.of({ current, other: [initial] })
