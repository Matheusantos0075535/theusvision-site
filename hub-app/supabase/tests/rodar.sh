#!/usr/bin/env bash
# Sobe um Postgres temporário, aplica o stub do Supabase, as migrações e roda os testes de RLS.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
# initdb não roda como root: repete o script como o usuário postgres do sistema.
if [ "$(id -u)" = "0" ]; then
  exec runuser -u postgres -- bash "$DIR/rodar.sh"
fi
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
TMP="$(mktemp -d)"
PORT="${PGPORT_TESTE:-54329}"
trap '"$PGBIN/pg_ctl" -D "$TMP/data" -m fast stop >/dev/null 2>&1 || true; rm -rf "$TMP"' EXIT

"$PGBIN/initdb" -D "$TMP/data" -U postgres -A trust >/dev/null
"$PGBIN/pg_ctl" -D "$TMP/data" -o "-p $PORT -k $TMP -c timezone=UTC" -l "$TMP/log" start -w >/dev/null

PSQL=(psql -h "$TMP" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X)
"${PSQL[@]}" -f "$DIR/stub_supabase.sql"
for f in "$DIR"/../migrations/*.sql; do "${PSQL[@]}" -f "$f"; done
for f in "$DIR"/teste_*.sql; do
  echo "== $(basename "$f")"
  "${PSQL[@]}" -o /dev/null -f "$f"
done
echo "Todos os testes passaram."
