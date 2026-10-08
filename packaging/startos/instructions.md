# Getting started

1. Start Terminus and wait for the Web Interface health check to pass. The first start compiles assets and initializes the database.
2. Open Web UI and click Register. The first registered user receives full access. Register your account before sharing the address; later users require verification.
3. In StartOS, configure a stable LAN address for the Web UI that your devices can reach. Run **Set Device Server URL** with that HTTP or HTTPS origin, then use the identical custom server URL in the TRMNL Wi-Fi portal. If no override is set, Terminus uses an address supplied by StartOS.
4. Add your device, create screens, and configure playlists in Terminus.

Devices need to reach this server directly. Use a LAN HTTP address if your firmware cannot validate the server's HTTPS certificate. Tor addresses require a Tor-capable client and are generally unsuitable for physical displays.

Changing the server address requires updating both the action and each device. Restart the service after changing the URL if it is stopped. Configuration changes while running restart the service automatically.

Back up with StartOS before updates. Backups include accounts, devices, screens, uploads, fonts, queued jobs, and internal credentials. The database is backed up with PostgreSQL's dump tool. Restore through StartOS, then check that the server URL is reachable on the new server.

Firmware, model, and font synchronization and some extensions require Internet access. Custom certificate installation through Compose's CERTIFICATE_URLS is not exposed in this package.

After an update, verify that an extension builds a screen from the Web UI and again through its configured schedule. Check `/sidekiq` while signed in. Web and worker use UTF-8 for both Ruby default encodings. Attached shells do not inherit the running service environment; diagnostics must use the service environment without printing its credentials. Keep your existing Set Device Server URL override when updating.

## Documentation

- [Device setup](https://github.com/usetrmnl/terminus/blob/main/doc/devices.adoc)
- [Extensions](https://github.com/usetrmnl/terminus/blob/main/doc/extensions.adoc)
- [Server API](https://github.com/usetrmnl/terminus/blob/main/doc/api.adoc)
