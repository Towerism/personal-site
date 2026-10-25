---
title: Home network
description: The hardware and self-hosted services on my home network, from single sign-on and ad-blocking DNS to media streaming and Minecraft.
---
# Home network

This is what I'm running and hosting on my home network. Unless otherwise mentioned, almost everything runs on the Raspberry Pi. I host Gitea and a CI controller on an old gaming PC, using Proxmox as the hypervisor.

## Hardware

- Raspberry Pi 4 Model B 4GB
- Old gaming PC (i7 3770K and 32GiB RAM) running Proxmox
- Purpose-built NAS PC (i5-9500T, 64GiB RAM, with 60TB storage + 10TB parity + 2GB cache) running Unraid
- Refurbished Dell OptiPlex mini (i5-8500T and 8GiB RAM), a dedicated streaming and transcoding box
- TP-Link Deco 7 Pro BE63 Mesh Wi-Fi System
- APC 1500VA UPS battery backup that keeps everything (except the Proxmox machine) running for about 30-45 minutes in a short power outage

## Services

### Authentik

Identity provider. Every service that supports OIDC or LDAP uses Authentik for single sign-on. For several services that don't (and even some that do, when I don't trust the built-in auth), the reverse proxy still redirects to Authentik first.

### AdGuard Home

Ad-blocking DNS server. It blocks ads for every device connected to my network. It supports DNS-over-HTTPS, so I can still use it when I'm not home.

### Caddy

Reverse proxy server with automatic HTTPS. A single Caddy instance routes all traffic to my exposed services. Caddy itself is exposed through a Cloudflare Tunnel, so I don't have to open any ports on my router.

### Homeassistant

Home automation software I use to control smart plugs, locks, the alarm system, and more.

### Gitea

Personal git repository hosting. The server sits in a VM within Proxmox. A controller written in Python dynamically spins up ephemeral VMs for CI/CD.

### Personal website

This very site is served from my own network. I used to serve it from Netlify, which is certainly much more reliable than self-hosting. But honestly, where's the fun in that!

### Plex Media Server

Media streaming server for the content stored on my NAS.

### Jellyfin

Media streaming server for the content stored on my NAS. It serves the exact same content as Plex; having both gives me another player option when one of them has trouble with a certain type of content.

### Portainer

Container management software. Almost everything I self-host runs in a container, and Portainer is the management console for many of them.

### Ghost

Self-hosted content management system.

### Tournament Genie

A custom discord bot and management app designed to streamline tournament staff communications. My wife and I organize competitive Pokemon tournaments. This makes it effortless to spin up and spin down dedicated channels for our events.

### Vaultwarden

Bitwarden-compatible password manager. I store my passwords, passkeys, and secure notes here. Since it's Bitwarden-compatible, it syncs with all of my and my family's devices.

## ...and much more!

There are so many more apps I self-host to automate things like media aggregation and management. Many of them replace monthly subscriptions I used to pay for and have since cancelled.
