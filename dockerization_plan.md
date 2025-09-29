# Dockerization Plan for TradeInsight

This guide outlines the phased approach to containerizing the TradeInsight application using Docker. The process is divided into phases to ensure a smooth transition from local development to containerized deployment.

## Phase 1: Preparation and Setup

### Step 1: Install Docker

Ensure Docker is installed on your Mac. Download from [docker.com](https://www.docker.com/products/docker-desktop) and start Docker Desktop.

### Step 2: Review Application Structure

- Confirm the app uses Vite for building (React 19 + TypeScript).
- Identify dependencies: Node.js, npm/yarn.
- Note external services: Auth0, Supabase, Stripe, OpenAI/Ollama (handle via environment variables).

### Step 3: Create .dockerignore

Create a `.dockerignore` file in the project root to exclude unnecessary files:

```
node_modules
.git
.env
.env.local
.env.production
README.md
.github
implementations
CLAUDE.md
*.log
```

## Phase 2: Development Environment

### Step 1: Create Dockerfile.dev

Create a `Dockerfile.dev` for development with hot reloading:

```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### Step 2: Build and Run Development Container

```bash
# Build the image
docker build -f Dockerfile.dev -t tradeinsight:dev .

# Run the container
docker run -p 5173:5173 -v $(pwd):/app tradeinsight:dev
```

### Step 3: Test Local Development

- Access the app at `http://localhost:5173`.
- Verify hot reloading works by editing files.

## Phase 3: Production Build

### Step 1: Create Multi-Stage Dockerfile

Create a `Dockerfile` for production with a multi-stage build to optimize size:

```dockerfile
# Dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Step 2: Build Production Image

```bash
docker build -t tradeinsight:prod .
```

### Step 3: Run Production Container

```bash
docker run -p 8080:80 tradeinsight:prod
```

- Access at `http://localhost:8080`.
- Test static file serving and ensure no runtime dependencies are missing.

## Phase 4: Environment and Services Integration

### Step 1: Handle Environment Variables

- Use a `.env` file for local development.
- For containers, pass variables via `docker run -e` or use `docker-compose` with an `env_file`.

### Step 2: Create docker-compose.yml

Set up a `docker-compose.yml` for the app and any local services (e.g., Ollama if running locally):

```yaml
version: '3.8'

services:
  tradeinsight:
    build: .
    ports:
      - '8080:80'
    env_file:
      - .env
    depends_on:
      - ollama # If using local Ollama

  ollama:
    image: ollama/ollama
    ports:
      - '11434:11434'
    volumes:
      - ollama_data:/root/.ollama

volumes:
  ollama_data:
```

### Step 3: Run with Compose

```bash
docker-compose up --build
```

- Test integrations with external APIs using environment variables.

## Phase 5: Testing and Optimization

### Step 1: Run Tests in Container

Modify the Dockerfile to include test running if needed, or run tests locally before building.

### Step 2: Optimize Image Size

- Use Alpine images.
- Minimize layers in Dockerfile.
- Check image size with `docker images`.

### Step 3: Security Scanning

Run a security scan on the image:

```bash
docker scan tradeinsight:prod
```

### Step 4: Deploy to Production

- Push to a registry (e.g., Docker Hub, AWS ECR).
- Deploy to a container orchestration platform like Kubernetes or use Vercel/Netlify for frontend hosting (since it's static).

## Phase 6: Monitoring and Maintenance

### Step 1: Add Health Checks

Add health checks to the Dockerfile for production monitoring.

### Step 2: Update CI/CD

Integrate Docker builds into your GitHub Actions workflow (e.g., build and push images on merge to main).

### Step 3: Document and Update README

Update the [`README.md`](README.md) with Docker usage instructions, including environment setup and common commands.

## Troubleshooting

- **Port Conflicts**: Ensure ports 5173 (dev) and 8080 (prod) are free.
- **Environment Issues**: Verify all required env vars are set.
- **Build Failures**: Check for missing dependencies or incorrect paths.
- **Performance**: For large apps, consider using Docker layers caching.

This phased approach ensures the app is containerized efficiently while maintaining functionality. Start with Phase 1 and progress incrementally.
