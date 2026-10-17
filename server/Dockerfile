# Turista-Life Administração: servidor Python + painel React compilado.
# Construído a partir da raiz do projeto (o painel reaproveita estilos e componentes de src/).

# Etapa 1: compila o painel (admin/).
FROM node:20-alpine AS admin
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tailwind.config.cjs vite.admin.config.ts ./
COPY types ./types
COPY src ./src
COPY admin ./admin
RUN npx vite build --config vite.admin.config.ts

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
COPY --from=admin /app/admin/dist ./admin-dist
RUN useradd --system --uid 10001 --no-create-home painel && mkdir /data && chown painel /data
USER painel

# Produção: cookie só por HTTPS, IP real vindo do nginx e pedidos aceitos só do endereço do painel.
ENV PAINEL_DATA_DIR=/data \
    PAINEL_ADMIN_DIST=/srv/admin-dist \
    PAINEL_COOKIE_SECURE=1 \
    PAINEL_TRUST_PROXY=1 \
    PAINEL_ALLOWED_ORIGINS=https://painel-turista-life.lbai.dev
VOLUME /data
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health')" || exit 1

# Um único processo: a trava de escrita (registro de atividades em ordem) vale dentro dele.
CMD ["sh", "-c", "python -m painel migrate && exec uvicorn painel.app:create_app --factory --host 0.0.0.0 --port 8000 --workers 1 --no-server-header"]
