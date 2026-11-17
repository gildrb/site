# Porthmeus: open a server's dev server on a Mac or phone

## Dev servers on every device

Porthmeus opens the dev server of a server on a Mac or phone, through a private HTTPS link on the Tailscale network.

```sh
curl -fsSL https://gildrb.com/porthmeus/install | sh
```

## Out of reach

A dev server listens on `localhost` of its server, out of reach of a laptop or phone. An SSH tunnel stops when the connection drops. A public tunnel puts unfinished work on the internet.

## One command

`porthmeus`, or its short form `p`, goes before the dev command:

```sh
porthmeus vp dev # or the short form: p vp dev
```

Porthmeus finds the port and gives it a private HTTPS link on the tailnet, through Tailscale Serve. Hot reload works, for Vite with its default configuration too. The link goes away when the command stops. `porthmeus dashboard` lists every dev server.

## Setup

Porthmeus runs on macOS and Linux. It needs Tailscale on both devices, MagicDNS and HTTPS certificates on for the tailnet, and access rules that allow the HTTPS port. Only devices of the tailnet can open the link.
