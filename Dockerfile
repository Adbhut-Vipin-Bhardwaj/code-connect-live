# Multi-stage Dockerfile for Code Connect Live
FROM ubuntu:24.04 AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    unzip \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install uv for Python dependency management
RUN pip3 install --break-system-packages uv

# Install Bun for frontend build
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# ============================================
# Backend Stage
# ============================================
FROM base AS backend-builder

WORKDIR /app/backend

# Copy backend dependency files
COPY backend/pyproject.toml ./

# Install Python dependencies
RUN uv sync

# Copy backend source code
COPY backend/ ./

# ============================================
# Frontend Stage  
# ============================================
FROM base AS frontend-builder

WORKDIR /app/frontend

# Copy frontend dependency files
COPY frontend/package.json ./
COPY frontend/bun.lockb* ./

# Install frontend dependencies
RUN bun install

# Copy frontend source code
COPY frontend/ ./

# Build the frontend for production
RUN bun run build

# ============================================
# Production Stage
# ============================================
FROM ubuntu:24.04 AS production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install uv for runtime
RUN pip3 install --break-system-packages uv

# Create app directory
WORKDIR /app

# Copy backend from builder stage
COPY --from=backend-builder /app/backend ./backend

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy nginx configuration
COPY <<EOF /etc/nginx/sites-available/default
server {
    listen 80;
    server_name _;
    
    # Serve frontend static files
    location / {
        root /app/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Create supervisor configuration
COPY <<EOF /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
user=root

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
stderr_logfile=/var/log/nginx.err.log
stdout_logfile=/var/log/nginx.out.log

[program:backend]
command=uv run python main.py
directory=/app/backend
autostart=true
autorestart=true
stderr_logfile=/var/log/backend.err.log
stdout_logfile=/var/log/backend.out.log
environment=HOST="0.0.0.0",PORT="3000"
EOF

# Expose port 80 (nginx will serve both frontend and proxy backend)
EXPOSE 80

# Create startup script
COPY <<EOF /app/start.sh
#!/bin/bash
set -e

echo "Starting Code Connect Live Application..."

# Sync backend dependencies
cd /app/backend
echo "Installing backend dependencies..."
uv sync

# Start supervisor (which will start both nginx and backend)
echo "Starting services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
EOF

RUN chmod +x /app/start.sh

# Set the startup command
CMD ["/app/start.sh"]