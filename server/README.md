# Turista-Life Administração — servidor

Python (FastAPI) + SQLite. Serve também o painel React compilado (`admin/`) e uma cópia do site
(em `/site/`) para a pré-visualização dentro do painel.

## Como o conteúdo funciona

- O mapa de tudo o que é editável fica em `src/cms/schema.ts` (+ `src/cms/layoutDefs.ts`, seções das
  páginas). Os textos fixos dos componentes usam `t('id', 'texto')`.
- `node scripts/export-cms.mjs` gera `server/painel/data/cms-schema.json` (mapa, usado pelo painel e
  pela validação) e `cms-defaults.json` (o conteúdo escrito hoje no código = ponto de partida).
  Rodar sempre que o mapa ou o conteúdo do código mudar. O Dockerfile roda sozinho.
- Ao iniciar, o servidor garante que todo documento do mapa existe no banco e grava
  `public/site.json` (o conteúdo publicado). O site público lê esse arquivo antes de montar a página;
  se ele não existir, o site usa o texto do código.
- Fotos enviadas viram `public/media/<id>/<largura>.webp` (sem GPS/EXIF). Capas de vídeos novos do
  YouTube são baixadas sozinhas para `public/thumbs/`.

## Desenvolvimento

```bash
uv sync                                                    # dentro de server/
uv run python -m painel migrate
uv run python -m painel create-admin --email voce@exemplo.com --name "Seu Nome"
uv run pytest -q
```

Servidores locais (`.claude/launch.json`):

- `painel-api` (porta 8011): este servidor.
- `site-preview` (porta 4323): o site com `BASE_PATH=/site/` e `VITE_CMS_PREVIEW=1` (pré-visualização).
- `painel` (porta 4322): o painel. Repassa `/api` e `/site/cms` para a 8011 e `/site` para a 4323.
- `turista-life` (porta 4321): o site público; repassa `/cms` para o painel local.

O banco local fica em `server/data/` (fora do Git).

## Produção (VPS)

- `docker-compose.yml`: container `turista-life-painel` em `127.0.0.1:3012`, com dois volumes:
  `painel-data` (banco, chave, backups; só o painel vê) e `painel-public` (conteúdo publicado e fotos;
  o painel escreve e o container do site lê em `/turista-life/cms/`, só leitura).
- nginx do host: arquivo novo `deploy/painel-turista-life.lbai.dev.conf` (só deste subdomínio).
- Primeiro administrador, depois do primeiro `docker compose up -d --build`:

```bash
docker compose exec turista-life-painel python -m painel create-admin --email E --name "Nome"
```

- Alertas por e-mail (opcional): criar `.env.painel` ao lado do `docker-compose.yml` (fora do Git) com
  `PAINEL_GMAIL_USER`, `PAINEL_GMAIL_APP_PASSWORD` (senha de app do Google) e `PAINEL_ALERT_TO`.
- Emergência (todos os administradores sem acesso):
  `docker compose exec turista-life-painel python -m painel emergency-reset --email E`
- Conferir o registro de atividades: `docker compose exec turista-life-painel python -m painel verify-activity`
- Backup diário automático às 03:00 UTC em `/data/backups` (30 diários + 12 mensais). Baixe uma
  cópia por mês em "Backup", no painel.

Rodar sempre com **um único processo** (`--workers 1`): a trava que mantém a corrente de hashes do
registro de atividades em ordem e as tarefas agendadas (publicação agendada, backup) vivem nele.
