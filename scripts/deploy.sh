#!/usr/bin/env bash
# Publica o site e o painel na VPS (ssh "mambo", /opt/turista-life).
#
#   bash scripts/deploy.sh            publica o commit atual (HEAD)
#   bash scripts/deploy.sh --check    só monta e confere o pacote, sem enviar nada
#
# Garantia: o conteúdo do painel feito NESTE computador (server/data: banco, fotos, chave, backups)
# nunca vai para produção. O pacote sai do `git archive` (só arquivos commitados; server/data é
# ignorado pelo Git) e ainda é conferido arquivo por arquivo antes do envio. O conteúdo de produção
# vive nos volumes Docker da VPS, que o deploy não toca.
set -euo pipefail

HOST=mambo
DEST=/opt/turista-life
URLS=(
  https://lbai.dev/turista-life/
  https://lbai.dev/turista-life/cms/site.json
  https://painel-turista-life.lbai.dev/api/health
  https://lbai.dev/
)
# Nada que case com isto pode estar no Git nem no pacote.
FORBIDDEN='(^|/)server/data/|(^|/)QA/|\.db$|\.db-(wal|shm|journal)$|(^|/)secret\.key$|(^|/)\.env|(^|/)node_modules/|(^|/)\.claude/'

CHECK_ONLY=0
[[ "${1:-}" == "--check" ]] && CHECK_ONLY=1

fail() { echo "DEPLOY RECUSADO: $*" >&2; exit 1; }

cd "$(git rev-parse --show-toplevel)"

# 1. O que vai é exatamente um commit: nada de alteração pendente em arquivo do projeto.
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  git status --short --untracked-files=no >&2
  fail "há alterações não commitadas. Faça o commit (ou descarte) antes de publicar."
fi

# 2. Nenhum dado local pode estar no Git.
if tracked=$(git ls-files | grep -E "$FORBIDDEN"); then
  echo "$tracked" >&2
  fail "arquivos proibidos estão no Git (dados locais do painel, .env, QA...)."
fi

# 3. Monta o pacote a partir do commit e confere o conteúdo dele.
PKG=$(mktemp -t turista-life-XXXXXX.tar.gz)
trap 'rm -f "$PKG"' EXIT
git -c core.autocrlf=false archive --format=tar.gz -o "$PKG" HEAD
if bad=$(tar tzf "$PKG" | grep -E "$FORBIDDEN"); then
  echo "$bad" >&2
  fail "o pacote contém arquivos proibidos."
fi

COMMIT=$(git rev-parse --short HEAD)
echo "Pacote ok: commit $COMMIT, $(tar tzf "$PKG" | grep -vc '/$') arquivos, sem server/data, banco, chave, .env nem QA."
if git rev-parse --verify -q '@{u}' >/dev/null && [[ -n "$(git log --oneline '@{u}..HEAD')" ]]; then
  echo "Aviso: o commit $COMMIT ainda não foi enviado ao GitHub (git push)."
fi
[[ $CHECK_ONLY == 1 ]] && { echo "Só conferência (--check): nada foi enviado."; exit 0; }

# 4. Backup do código atual na VPS, envio e reconstrução (os volumes do painel ficam intactos).
STAMP=$(date +%Y%m%d-%H%M%S)
echo "Backup em $HOST:/root/turista-life-backup-$STAMP.tgz"
ssh "$HOST" "cd /opt && tar czf /root/turista-life-backup-$STAMP.tgz turista-life"
echo "Enviando o commit $COMMIT..."
ssh "$HOST" "tar xzf - -C $DEST && echo '$COMMIT' > $DEST/.deployed-commit" < "$PKG"
ssh "$HOST" "cd $DEST && docker compose up -d --build 2>&1 | tail -5"

# 5. Espera os containers ficarem saudáveis e testa os endereços.
for _ in $(seq 1 24); do
  status=$(ssh "$HOST" "docker inspect -f '{{.State.Health.Status}}' turista-life turista-life-painel" | sort -u)
  [[ "$status" == "healthy" ]] && break
  sleep 5
done
ssh "$HOST" "docker ps --format '{{.Names}}: {{.Status}}' | grep turista-life"
ok=1
for u in "${URLS[@]}"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$u")
  echo "$code  $u"
  [[ "$code" == 200 ]] || ok=0
done
[[ $ok == 1 ]] || fail "algum endereço não respondeu 200 (backup: /root/turista-life-backup-$STAMP.tgz)."
echo "Publicado: commit $COMMIT."
