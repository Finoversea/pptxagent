# Docker Deployment Guide

PPTX Agent can be deployed using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Anthropic API key

## Quick Start

### 1. Set Environment Variables

Create a `.env` file in the project root:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

### 2. Build and Run

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │    Backend      │     │     Redis       │
│   (NextJS)      │────▶│   (FastAPI)     │────▶│   (Cache)       │
│   Port: 3000    │     │   Port: 8000    │     │   Port: 6379    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Services

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| frontend | pptx-frontend | 3000 | NextJS web interface |
| backend | pptx-backend | 8000 | FastAPI + Claude API |
| redis | pptx-redis | 6379 | Optional caching |

## Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose build --no-cache

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Check service health
docker-compose ps

# Execute command in container
docker-compose exec backend bash
docker-compose exec frontend sh
```

## Production Deployment

### Environment Variables

Set these for production:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL (from frontend perspective) |
| `REDIS_URL` | Optional | Redis connection URL |

### Security Considerations

1. **Never expose API keys in code**
2. **Use Docker secrets or environment files**
3. **Limit CORS origins in production** (update `backend/app/main.py`)
4. **Add HTTPS with reverse proxy** (nginx, traefik)

### Scaling

For horizontal scaling:

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
```

Use a load balancer (nginx/traefik) to distribute requests.

## Troubleshooting

### Backend won't start

Check if Anthropic API key is set:

```bash
docker-compose exec backend env | grep ANTHROPIC
```

### Frontend can't reach backend

Verify network connectivity:

```bash
docker-compose exec frontend ping backend
```

### Redis connection issues

Check Redis health:

```bash
docker-compose exec redis redis-cli ping
```

## File Structure

```
pptxagent/
├── docker-compose.yml          # Main compose file
├── backend/
│   ├── Dockerfile              # Backend container
│   ├── .dockerignore           # Exclude files
│   └── requirements.txt        # Python dependencies
├── web/
│   ├── Dockerfile              # Frontend container
│   ├── .dockerignore           # Exclude files
│   └── next.config.js          # NextJS config (standalone output)
└── docs/
    └── DOCKER.md               # This documentation
```