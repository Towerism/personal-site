# Home network

This is what I am running and/or hosting on my home network. I plan on adding a NAS in the future. Unless otherwise mentioned, almost everything is ran on the Raspberry Pi. I'm hosting mainly Minecraft related stuff on an old gaming PC using Proxmox as a host for a couple Debian VMs.

- • Raspberry Pi 4 Model B 4GB
- • Old gaming PC (i7 3770K and 32GiB RAM) running Proxmox
- • Purpose-built NAS PC (i9-9500T, 64GiB RAM, with 60TB storage + 10TB parity + 2GB cache) running Unraid
- • Refurbished dell optiplex mini (i8-8500T and 8GiB RAM) dedicated streaming/transcoding box
- • TP-Link AX4400 Wifi 6 Router
- • APC 1500VA UPS battery backup to keep everything (except for the Proxmox machine) running in the event of a short power outage for about 30-45 minutes

### Authentik

Identity provider. All of the services that support OIDC or LDAP I have setup to utilize Authentik for single sign on. Even for several services that don't (and even some that do but I don't trust the built-in auth), I still have the reverse proxy set up to redirect to authentik first.

### Actual

Privacy-first personal finance management application. All of my budgeting and expense tracking is done through this. I used to use an app called YNAB, but it's more fun to self-host this. Plus I don't have to pay $100 a year anymore.

### AdGuard Home

Ad-blocking DNS server. It provides ad-blocking for every device connected to my network. It supports DNS-over-https so I can still utilize it even when I am not home.

### Caddy

Reverse proxy server with automatic HTTPS. I use a single Caddy instance to route all traffic to my exposed services. The Caddy instance itself is exposed via a Cloudflare Tunnel. Thanks to which I don't have to open up any ports on my router.

### Homeassistant

Home automation software used to control smart plugs, locks, alarm system, etc.

### Karaoke Eternal

Web-based karaoke software used to enjoy karaoke tracks and CDGs stored on the NAS. Multi-room and fair queue-management built-in for maximum convenience.

### Minecraft servers

I am self-hosting 3 different [Minecraft servers](https://www.closetcraft.online){class="link" target="\_blank"}. One is just a proxy for the other two. The other two are a lobby where players funnel in through and a survival server. Eventually I might add more Minecraft servers, so that's why I am using this setup. These are all running on my old Gaming PC under one of my Proxmox VMs. I run two VMs total: one for the [Pterodactyl](#pterodactyl){class="link"} panel, and the other for the actual Minecraft servers.

### Personal website

I used to use netlify to serve this website. And that's certainly much more reliable than self-hosting. But honestly where's the fun in that!

### Plex Media Server

Media streaming server used to consume content stored on my NAS.

### Jellyfin

Media streaming server used to consume content stored on my NAS. It consumes the exact same content as Plex; having both just gives me multiple player options if one or the other has issues with certain types of content.

### Portainer

Container management software. Almost everything I self-host is running in a container. Portainer is the management console for all of the containers that I run.

### Pterodactyl

Minecraft server management panel. It's great for managing multiple minecraft servers. They can be monitored and controlled straight from the panel. I have this running on my old Gaming PC in one of the Proxmox VMs. The Minecraft servers themselves are running on another VM.

### Vaultwarden

Bitwarden-compatible password manager. I store my passwords, passkeys, and secure notes on this application. And since it is Bitwarden-compatible, I can sync it with all mine and my family's devices.

### ...and much more!

There are so many more apps that I self-host to automate things like media aggregation and management. Many of the apps I self-host I used to pay monthly subscriptions for but that I have since cancelled.
