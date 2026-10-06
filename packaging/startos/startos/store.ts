import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from './sdk'
export const store = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'store.json' },
  z.object({
    appSecret: z.string().min(64),
    pgPassword: z.string().min(32),
    redisPassword: z.string().min(32),
    apiUri: z.string(),
  }),
)
