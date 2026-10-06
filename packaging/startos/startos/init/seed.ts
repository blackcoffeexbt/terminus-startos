import { randomBytes } from 'node:crypto'
import { chmod } from 'node:fs/promises'
import { sdk } from '../sdk'
import { store } from '../store'
export const seed = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return
  await store.write(effects, {
    appSecret: randomBytes(40).toString('hex'),
    pgPassword: randomBytes(24).toString('hex'),
    redisPassword: randomBytes(24).toString('hex'),
    apiUri: '',
  })
  await chmod(store.path, 0o600)
})
