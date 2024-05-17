# Home network

This is what I am running and/or hosting on my home network.

## Hardware

This is the hardware that I consider to be the heart of my network.

- Raspberry Pi 4 Model B 4GB
- TP-Link AX4400 Wifi 6 Router

## Selfhosted

These are the software applications that I self-host on my network.

### This website

I used to use netlify to serve my website. And that's certainly much more reliable than selfhosting. But honestly where's the fun in that!

### Caddy

Reverse proxy server with automatic HTTPS. I use a single Caddy instance to route all traffic to my exposed services. I send traffic to the Caddy instance through a Cloudflare Tunnel. I don't have to open up any ports on my router.

### AdGuard Home
 
Ad-blocking DNS server. It provides ad-blocking for every device connected to my network. It supports DNS-over-https so I can still utilize it even when I am not home.

### Vaultwarden

Bitwarden-compatible password manager. I store my passwords, passkeys, and secure notes on this application. And since it is Bitwarden-compatible, I can sync it with all mine and my family's devices.


