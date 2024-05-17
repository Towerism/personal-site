# Home network

This is what I am running and/or hosting on my home network. I plan on adding a NAS in the future. I also have an old gaming PC that I might turn into a server later on.

- Raspberry Pi 4 Model B 4GB
- TP-Link AX4400 Wifi 6 Router

### This website

I used to use netlify to serve my website. And that's certainly much more reliable than selfhosting. But honestly where's the fun in that!

### Caddy

Reverse proxy server with automatic HTTPS. I use a single Caddy instance to route all traffic to my exposed services. The Caddy instance itself is exposed via a Cloudflare Tunnel. Thanks to which I don't have to open up any ports on my router.

### AdGuard Home

Ad-blocking DNS server. It provides ad-blocking for every device connected to my network. It supports DNS-over-https so I can still utilize it even when I am not home.

### Vaultwarden

Bitwarden-compatible password manager. I store my passwords, passkeys, and secure notes on this application. And since it is Bitwarden-compatible, I can sync it with all mine and my family's devices.

### Actual

Privacy-first personal finance management application. All of my budgeting and expense tracking is done through this. I used to an app called YNAB, but it's more fun to selfhost this. Plus I don't have to pay $100 a year anymore.

### Code Server

Remote instance of VS Code accessible from the browser. I can easily connect to this whenever I need to update a config file on the Raspberry Pi if I don't feel like using SSH.
