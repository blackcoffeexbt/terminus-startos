import { sdk } from './sdk'
import { store } from './store'
export const { createBackup, restoreInit } = sdk.setupBackups(async () =>
  sdk.Backups.withPgDump({
    imageId: 'postgres',
    dbVolume: 'postgres',
    mountpoint: '/var/lib/postgresql',
    pgdataPath: '/18/docker',
    database: 'terminus',
    user: 'terminus',
    password: async () => {
      const config = await store.read().once()
      if (!config) throw new Error('Missing database credentials')
      return config.pgPassword
    },
  })
    .addVolume('main')
    .addVolume('valkey')
    .addVolume('fonts')
    .addVolume('uploads'),
)
