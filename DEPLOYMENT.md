# Deployment Guide

## GitHub Actions CI/CD

This project uses GitHub Actions to automatically build and push Docker images to GitHub Container Registry (GHCR).

### Workflow Triggers

The Docker workflow is triggered on:
- Push to `main` branch
- New version tags (e.g., `v1.0.0`)
- Pull requests to `main` branch
- Manual workflow dispatch

### Generated Image Tags

- `latest` - Latest build from `main` branch
- `main-{sha}` - Specific commit hash for `main` branch
- `v1.0.0`, `v1.0`, `v1` - Semantic version tags
- `pr-{number}` - Pull request builds (not pushed to registry)

### Image Repository

Images are pushed to: `ghcr.io/<your-username>/mockkeys`

### Using the Image

Pull the image:
```bash
docker pull ghcr.io/<your-username>/mockkeys:latest
```

Run the container:
```bash
docker run -d \
  --name mockapi \
  -p 3008:3008 \
  ghcr.io/<your-username>/mockkeys:latest
```

With persistent database:
```bash
docker run -d \
  --name mockapi \
  -p 3008:3008 \
  -v mockapi-db-data:/app/db \
  ghcr.io/<your-username>/mockkeys:latest
```

## Local Development with Docker Compose

Build and run:
```bash
docker-compose up -d --build
```

View logs:
```bash
docker-compose logs -f
```

Stop the service:
```bash
docker-compose down
```

Stop and remove volumes:
```bash
docker-compose down -v
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Port configuration
PORT=3008

# Node environment
NODE_ENV=production

# CORS configuration
CORS_ORIGIN=http://localhost:3008

# Database configuration
DB_PATH=./db/data.sqlite
```

## Multi-Platform Support

The Docker images are built for multiple architectures:
- `linux/amd64` - Standard x86_64
- `linux/arm64` - ARM64/Apple Silicon

## Security

- GitHub Actions uses `GITHUB_TOKEN` for authentication (no manual setup required)
- Images use the minimal `node:20-alpine` base image
- Health checks are configured for container monitoring

## Monitoring

The container includes a health check that verifies the service is responding:

```bash
docker inspect --format='{{.State.Health.Status}}' mockapi
```

## Troubleshooting

### Image Build Fails

Check the Actions tab in your GitHub repository for detailed error logs.

### Container Won't Start

Check logs:
```bash
docker-compose logs mockapi
```

### Database Persistence

Ensure the volume is properly mounted. Use named volumes for persistence across container recreations.

### Permission Issues

On Linux, you may need to adjust permissions for the `db` directory:
```bash
sudo chown -R 1000:1000 ./db
```
