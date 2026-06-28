# Despliegue con Docker en DonWeb (Cloud Server)

App **Next.js 16** dockerizada con build `standalone` y reverse proxy **Caddy** (HTTPS automático).

## Requisitos en el VPS

- Docker Engine + plugin `docker compose`
- Puertos **80** y **443** abiertos en el firewall
- Un dominio con registro **A** apuntando al IP del servidor (necesario para el certificado TLS)

### Instalar Docker (Ubuntu/Debian)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # reloguear después de esto
```

## Despliegue

```bash
# 1. Clonar el repo
git clone <URL_DEL_REPO> app && cd app

# 2. Crear el .env a partir del ejemplo y completar valores
cp .env.example .env
nano .env

# 3. Levantar (build + run)
docker compose up -d --build

# 4. Ver logs
docker compose logs -f app
```

Luego abrir `https://TU_DOMINIO`.

## Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `DOMAIN` | Dominio público (lo usa Caddy para emitir el certificado) |
| `NEXT_PUBLIC_API` | URL de la API. **Se incrusta en el build** del cliente |
| `NEXT_PUBLIC_SOCKET_URL` | URL del socket |
| `API` | URL de la API usada en SSR (servidor) |

> ⚠️ Las variables `NEXT_PUBLIC_*` se "queman" durante el build. Si cambian, hay que reconstruir:
> `docker compose up -d --build`

## Actualizar a una nueva versión

```bash
git pull
docker compose up -d --build
docker image prune -f
```

## Comandos útiles

```bash
docker compose ps             # estado
docker compose logs -f        # logs en vivo
docker compose down           # detener
docker compose restart app    # reiniciar solo la app
```
