# Turista-Life Administração: servidor Python + painel React + cópia do site para a pré-visualização.
# Construído a partir da raiz do projeto (o painel reaproveita o mapa de conteúdo e os componentes de src/).

# Etapa 1: exporta o mapa de conteúdo e compila o painel e a cópia do site (base /site/).
FROM node:20-alpine AS front
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tailwind.config.cjs vite.config.ts vite.admin.config.ts index.html ./
COPY types ./types
COPY public ./public
COPY src ./src
COPY admin ./admin
COPY scripts ./scripts
RUN mkdir -p server/painel/data && node scripts/export-cms.mjs
RUN npx vite build --config vite.admin.config.ts
RUN BASE_PATH=/site/ VITE_CMS_PREVIEW=1 npx vite build --outDir site-dist

# Etapa 2: servidor Python, rodando sem root.
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH=/opt/venv/bin:$PATH
COPY --from=ghcr.io/astral-sh/uv:0.11.3 /uv /usr/local/bin/uv
WORKDIR /srv
COPY server/pyproject.toml server/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project && rm /usr/local/bin/uv
COPY server/painel ./painel
COPY server/migrations ./migrations
COPY server/alembic.ini ./
COPY --from=front /app/server/painel/data/cms-schema.json /app/server/painel/data/cms-defaults.json ./painel/data/
COPY --from=front /app/admin/dist ./admin-dist
COPY --from=front /app/site-dist ./site-dist
# /data/public já nasce do usuário do painel: o volume compartilhado com o site herda essa permissão.
RUN useradd --system --uid 10001 --no-create-home painel && mkdir -p /data/public && chown -R painel /data
USER painel

# Produção: cookie só por HTTPS, IP real vindo do nginx e pedidos aceitos só do endereço do painel.
# Alertas por Gmail: PAINEL_GMAIL_USER, PAINEL_GMAIL_APP_PASSWORD e PAINEL_ALERT_TO (no .env do servidor).
ENV PAINEL_DATA_DIR=/data \
    PAINEL_ADMIN_DIST=/srv/admin-dist \
    PAINEL_SITE_DIST=/srv/site-dist \
    PAINEL_COOKIE_SECURE=1 \
    PAINEL_TRUST_PROXY=1 \
    PAINEL_ALLOWED_ORIGINS=https://painel.turistalife.com
VOLUME /data
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health')" || exit 1

# Um único processo: a trava de escrita (registro de atividades em ordem) e as tarefas agendadas vivem nele.
CMD ["sh", "-c", "python -m painel migrate && exec uvicorn painel.app:create_app --factory --host 0.0.0.0 --port 8000 --workers 1 --no-server-header"]
