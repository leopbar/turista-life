# Turista Life — regras do projeto

## Deploy

- Publicar na VPS **só** com `bash scripts/deploy.sh` (ou `--check` para conferir o pacote sem enviar).
  Nunca montar o envio à mão (tar, scp, rsync) nem copiar arquivos soltos para `/opt/turista-life`.
- O conteúdo do painel feito neste computador (`server/data/`: banco, fotos, chave, backups) **nunca** vai
  para produção: não commitar, não copiar para a VPS, não restaurar o banco local nos volumes do servidor.
  O conteúdo de produção vive nos volumes Docker `turista-life_painel-data` e `turista-life_painel-public`.
- O teste `server/tests/test_deploy_guard.py` falha se essas proteções (`.gitignore`, `.dockerignore`,
  Dockerfile do painel, script de deploy) forem desfeitas.
- Na VPS só mexer nos containers `turista-life` e `turista-life-painel` e nos arquivos de nginx deles;
  `nginx -t` antes de `systemctl reload nginx`. O nginx do servidor é 1.24: usar `listen 443 ssl http2;`.
