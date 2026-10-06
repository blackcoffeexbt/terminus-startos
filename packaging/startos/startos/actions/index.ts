import { sdk } from '../sdk'
import { store } from '../store'
const configure = sdk.Action.withInput(
  'device-url',
  {
    name: 'Set Device Server URL',
    description:
      'Set the HTTP or HTTPS origin reachable by your TRMNL devices. Use the same URL in the device Wi-Fi portal.',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  sdk.InputSpec.of({
    apiUri: sdk.Value.text({
      name: 'Server URL',
      description:
        'Example: http://192.168.1.10:2300. No path or trailing slash.',
      required: true,
      default: '',
    }),
  }),
  async () => ({ apiUri: (await store.read().once())?.apiUri ?? '' }),
  async ({ effects, input }) => {
    const url = new URL(input.apiUri)
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    )
      throw new Error(
        'Enter an HTTP or HTTPS origin without credentials, path, query, or fragment.',
      )
    await store.merge(effects, { apiUri: url.origin })
  },
)
export const actions = sdk.Actions.of().addAction(configure)
