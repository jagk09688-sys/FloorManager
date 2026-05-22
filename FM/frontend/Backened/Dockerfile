# ── Backend Dockerfile ────────────────────────────────────────────────────────
# Node 20 + Python 3 (for ReportLab PDF generation)

FROM node:20-slim

# Install Python + pip + ReportLab
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    --no-install-recommends \
  && python3 -m venv /opt/venv \
  && /opt/venv/bin/pip install --no-cache-dir reportlab \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Make venv python the default so python-shell finds it
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Install Node deps first (layer cache)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema + config, then generate client
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# Copy rest of source
COPY . .

EXPOSE 5001

# On startup: run DB migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
