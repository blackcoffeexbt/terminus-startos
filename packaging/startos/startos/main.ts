import { sdk } from './sdk'
import { store } from './store'
import { uiPort } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  const config = await store.read().const(effects)
  if (!config)
    throw new Error(
      'Missing package configuration; restore the main volume with the database.',
    )
  const host = await sdk.host.getOwn(effects, 'ui-multi').const()
  const ui = Object.values(host?.bindings ?? {})
    .flatMap((b) => Object.values(b.interfaces))
    .find((i) => i.id === 'ui')
  const addresses = ui?.addressInfo.nonLocal
  const apiUri =
    config.apiUri ||
    addresses
      ?.filter({ kind: 'ipv4', visibility: 'private' })
      .format('urlstring')[0] ||
    addresses?.format('urlstring')[0]
  if (!apiUri)
    throw new Error('Configure a network address or use Set Device Server URL.')
  const mount = (
    volumeId: 'postgres' | 'valkey' | 'fonts' | 'uploads',
    mountpoint: string,
  ) =>
    sdk.Mounts.of().mountVolume({
      volumeId,
      subpath: null,
      mountpoint,
      readonly: false,
    })
  const pg = sdk.SubContainer.of(
    effects,
    { imageId: 'postgres' },
    mount('postgres', '/var/lib/postgresql'),
    'postgres',
  )
  const cache = sdk.SubContainer.of(
    effects,
    { imageId: 'valkey' },
    mount('valkey', '/data'),
    'valkey',
  )
  const appMounts = mount('fonts', '/app/public/fonts')
    .mountVolume({
      volumeId: 'fonts',
      subpath: null,
      mountpoint: '/usr/share/fonts/terminus',
      readonly: false,
    })
    .mountVolume({
      volumeId: 'assets',
      subpath: null,
      mountpoint: '/app/public/assets',
      readonly: false,
    })
    .mountVolume({
      volumeId: 'uploads',
      subpath: null,
      mountpoint: '/app/public/uploads',
      readonly: false,
    })
  const web = sdk.SubContainer.of(
    effects,
    { imageId: 'terminus' },
    appMounts,
    'web',
  )
  const worker = sdk.SubContainer.of(
    effects,
    { imageId: 'terminus' },
    appMounts,
    'worker',
  )
  const env = {
    HANAMI_PORT: String(uiPort),
    API_URI: String(apiUri),
    APP_SECRET: config.appSecret,
    DATABASE_URL: `postgres://terminus:${config.pgPassword}@127.0.0.1:5432/terminus`,
    KEYVALUE_URL: `redis://:${config.redisPassword}@127.0.0.1:6379/0`,
  }
  return sdk.Daemons.of(effects)
    .addDaemon('postgres', {
      subcontainer: pg,
      exec: {
        command: sdk.useEntrypoint([
          'postgres',
          '-c',
          'listen_addresses=127.0.0.1',
        ]),
        env: {
          POSTGRES_USER: 'terminus',
          POSTGRES_DB: 'terminus',
          POSTGRES_PASSWORD: config.pgPassword,
        },
      },
      ready: {
        display: null,
        fn: () =>
          sdk.healthCheck.runHealthScript(
            [
              'pg_isready',
              '-h',
              '127.0.0.1',
              '-U',
              'terminus',
              '-d',
              'terminus',
            ],
            pg,
            { errorMessage: 'Database is starting' },
          ),
      },
      requires: [],
    })
    .addOneshot('cache-permissions', {
      subcontainer: cache,
      exec: {
        command: ['chown', '-R', 'valkey:valkey', '/data'],
        user: 'root',
      },
      requires: [],
    })
    .addDaemon('valkey', {
      subcontainer: cache,
      exec: {
        command: [
          'valkey-server',
          '--bind',
          '127.0.0.1',
          '--dir',
          '/data',
          '--appendonly',
          'yes',
          '--requirepass',
          config.redisPassword,
          '--maxmemory',
          '512mb',
          '--maxmemory-policy',
          'noeviction',
        ],
        user: 'valkey',
      },
      ready: {
        display: null,
        fn: () =>
          sdk.healthCheck.runHealthScript(
            ['valkey-cli', '-a', config.redisPassword, 'ping'],
            cache,
            { errorMessage: 'Valkey is starting' },
          ),
      },
      requires: ['cache-permissions'],
    })
    .addOneshot('app-permissions', {
      subcontainer: web,
      exec: {
        command: [
          'chown',
          '-R',
          '1000:1000',
          '/app/public/fonts',
          '/app/public/uploads',
          '/app/public/assets',
        ],
        user: 'root',
      },
      requires: [],
    })
    .addOneshot('assets', {
      subcontainer: web,
      exec: { command: ['bundle', 'exec', 'hanami', 'assets', 'compile'], env },
      requires: ['app-permissions', 'postgres', 'valkey'],
    })
    .addOneshot('migrate', {
      subcontainer: web,
      exec: { command: ['bundle', 'exec', 'hanami', 'db', 'migrate'], env },
      requires: ['assets'],
    })
    .addDaemon('web', {
      subcontainer: web,
      exec: {
        command: sdk.useEntrypoint(),
        env: { ...env, APP_SETUP: 'false', STARTOS_RUBY_UTF8: 'true' },
      },
      ready: {
        display: 'Web Interface',
        gracePeriod: 120000,
        fn: () =>
          sdk.healthCheck.runHealthScript(
            ['curl', '--fail', '--silent', 'http://127.0.0.1:2300/up'],
            web,
            { errorMessage: 'Terminus is starting' },
          ),
      },
      requires: ['migrate'],
    })
    .addDaemon('worker', {
      subcontainer: worker,
      exec: {
        command: sdk.useEntrypoint([
          'bundle',
          'exec',
          'sidekiq',
          '-r',
          './config/sidekiq.rb',
        ]),
        env: { ...env, APP_SETUP: 'false', STARTOS_RUBY_UTF8: 'true' },
      },
      ready: {
        display: 'Background Worker',
        fn: () =>
          sdk.healthCheck.runHealthScript(
            [
              'ruby',
              '-e',
              'exit(Dir.glob("/proc/[0-9]*/cmdline").any? { |p| (File.binread(p).split("\\0").first || "").start_with?("sidekiq") rescue false } ? 0 : 1)',
            ],
            worker,
            {
              errorMessage: 'Worker is starting',
            },
          ),
      },
      requires: ['web'],
    })
})
