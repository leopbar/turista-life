# Turista-Life Administração — servidor

Python (FastAPI) + SQLite. Também serve o painel React compilado (`admin/`).

## Desenvolvimento

```bash
uv sync                                                    # dentro de server/
uv run python -m painel migrate
uv run python -m painel create-admin --email voce@exemplo.com --name "Seu Nome"
uv run pytest -q
```

Servidores locais (`.claude/launch.json`): `painel-api` (porta 8011) e `painel` (Vite, porta 4322,
repassa `/api` para a 8011). O banco local fica em `server/data/` (fora do Git).

## Produção (VPS)

- Container `turista-life-painel` em `127.0.0.1:3011` (ver `docker-compose.yml`). Os dados ficam no
  volume `painel-data` (banco + chave). A cada início, o container atualiza as tabelas sozinho.
- nginx do host: arquivo novo `deploy/painel-turista-life.lbai.dev.conf` (só deste subdomínio).
- Primeiro administrador, depois do primeiro `docker compose up -d --build turista-life-painel`:

```bash
docker compose exec turista-life-painel python -m painel create-admin --email E --name "Nome"
```

- Emergência (todos os administradores sem acesso):
  `docker compose exec turista-life-painel python -m painel emergency-reset --email E`
- Conferir o registro de atividades: `docker compose exec turista-life-painel python -m painel verify-activity`

Rodar sempre com **um único processo** (`--workers 1`): a trava que mantém a corrente de hashes do
registro de atividades em ordem vale dentro do processo.
