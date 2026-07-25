# Deployment addresses (persistent)

- Builder VPS: 155.117.127.185, SSH port 9011, user root
  - Repo path: /opt/build/rezaie
  - Image output: /root/rezaie-app.tar.gz
- Iranian VPS (production): 87.107.12.53, SSH port 9011, user root
  - Compose path: /opt/rezaie
  - App port: 4000 (Nginx proxies persianways.ir here)
  - Postgres host port: 5433
- Iranian VPS internet: only via SOCKS5 tunnel 127.0.0.1:10808 (no direct egress)
- Laptop transfer path: $env:USERPROFILE\Downloads\rezaie-app.tar.gz

## Routine
1. Builder: git pull + docker build --no-cache + docker save | gzip
2. Laptop: scp -P 9011 from builder, then scp -P 9011 to Iranian VPS
3. Iranian VPS: docker tag latest->previous, docker load, docker-compose up -d
