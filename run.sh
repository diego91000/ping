#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

# Option : ./run.sh --reset-db pour repartir d'une base vierge
# (utile si le login admin.root/adminpwd échoue à cause d'une vieille base).
if [ "$1" = "--reset-db" ]; then
  docker rm -f ping-db 2>/dev/null || true
fi

# 1. Base de données PostgreSQL
if docker ps --format '{{.Names}}' | grep -qx "ping-db"; then
  echo "➡  PostgreSQL déjà lancé"
elif docker ps -a --format '{{.Names}}' | grep -qx "ping-db"; then
  echo "➡  Redémarrage de l'ancien conteneur ping-db"
  docker start ping-db
else
  echo "➡  Création du conteneur ping-db"
  docker run -d --name ping-db \
    -e POSTGRES_DB=ping \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -p 5432:5432 \
    postgres:16
fi

until docker exec ping-db pg_isready -U postgres >/dev/null 2>&1; do
  sleep 1
done

# 2. Dossier de travail : un workspace DÉDIÉ (et plus la racine / du disque,
#    qui exposait tout le système de fichiers à la suppression récursive).
WORKSPACE="${FILESYSTEM_DEFAULT_PATH:-$HOME/ping-workspace}"
mkdir -p "$WORKSPACE"
[ -f "$WORKSPACE/main.py" ] || echo 'print("bonjour")' > "$WORKSPACE/main.py"

# 3. Backend sur le port 8080 (crée/répare admin.root / adminpwd au lancement)
mvn -q package -DskipTests
FILESYSTEM_DEFAULT_PATH="$WORKSPACE" java -jar target/quarkus-app/quarkus-run.jar > backend.log 2>&1 &
trap 'kill $! 2>/dev/null' EXIT

# 4. Frontend sur le port 5173
cd front
[ -d node_modules ] || npm install
echo "➡  Workspace : $WORKSPACE"
echo "➡  Ouvre Chrome sur http://localhost:5173"
npm run dev

