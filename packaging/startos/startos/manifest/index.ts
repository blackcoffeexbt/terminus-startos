import { setupManifest } from '@start9labs/start-sdk'
export const manifest = setupManifest({
  id: 'terminus',
  title: 'Terminus',
  license: 'MIT',
  upstreamRepo: 'https://github.com/usetrmnl/terminus',
  packageRepo: 'https://github.com/usetrmnl/terminus',
  marketingUrl: 'https://trmnl.com',
  donationUrl: null,
  description: {
    short: { en_US: 'Manage TRMNL e-paper displays on your own server' },
    long: {
      en_US:
        'Terminus manages TRMNL devices, renders screens, schedules playlists, and runs extensions. This package includes PostgreSQL and Valkey.',
    },
  },
  volumes: ['main', 'postgres', 'valkey', 'fonts', 'uploads', 'assets'],
  images: {
    terminus: {
      source: {
        dockerBuild: { dockerfile: '../../Dockerfile', workdir: '../..' },
      },
      arch: ['x86_64', 'aarch64'],
    },
    postgres: {
      source: { dockerTag: 'postgres:18.6-alpine' },
      arch: ['x86_64', 'aarch64'],
    },
    valkey: {
      source: { dockerTag: 'valkey/valkey:9.1-alpine' },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {},
})
