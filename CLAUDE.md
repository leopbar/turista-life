# Turista Life — regras do projeto

## Deploy

- Publicar na VPS **só** com `bash scripts/deploy.sh` (ou `--check` para conferir o pacote sem enviar).
  Nunca montar o envio à mão (tar, scp, rsync) nem copiar arquivos soltos para `/opt/turista-life`.
- O conteúdo do painel feito neste computador (`server/data/`: banco, fotos, chave, backups) **nunca** vai
  para produção: não commitar, não copiar para a VPS, não restaurar o banco local nos volumes do servidor.
  O conteúdo de produção vive nos volumes Docker `turista-life_painel-data` e `turista-life_painel-public`.
- O teste `server/tests/test_deploy_guard.py` falha se essas proteções (`.gitignore`, `.dockerignore`,
  Dockerfile do painel, script de deploy) forem desfeitas.
- O script só publica um commit que já está no GitHub com o CI verde (`.github/workflows/ci.yml`).
  Não existe atalho para pular essa trava.

## CI e contrato do CMS

- O CI (`.github/workflows/ci.yml`) compila o site, o painel e a pré-visualização, roda os testes do painel
  e confere o **contrato do CMS** (`scripts/check-cms-contract.mjs`).
- Mudou `src/cms/schema.ts`, `layoutDefs.ts`, um texto `t('id', …)`, um conteúdo do código ou uma foto em
  `public/images`? Rode `node scripts/export-cms.mjs` e commite `server/painel/data/cms-*.json` junto;
  senão o CI reprova ("mapa do painel desatualizado").
- Remover/renomear campo, página, lista, tipo de bloco ou texto fixo, trocar o tipo de um campo, remover
  opção de lista, tornar campo obrigatório, apertar limite ou apagar foto do site reprova o CI (🔴/🟠),
  porque estraga conteúdo que a Laura já editou. Prefira mudanças que só **acrescentam**. Se a mudança
  for de propósito, avise o usuário do impacto e só então use a linha `CMS-impacto: aceito` na mensagem do
  commit (com a autorização dele).

## VPS

- Na VPS só mexer nos containers `turista-life` e `turista-life-painel` e nos arquivos de nginx deles;
  `nginx -t` antes de `systemctl reload nginx`. O nginx do servidor é 1.24: usar `listen 443 ssl http2;`.
