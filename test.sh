#!/usr/bin/env bash
# Lance toute la suite de tests du projet : backend (Maven) puis frontend (Vitest).
# `set -e` : on s'arrête au premier échec, donc le script sort en erreur (et la CI
# passe au rouge) dès que l'un des deux jeux de tests casse.
set -euo pipefail

# On se place à la racine du projet, quel que soit l'endroit d'où on appelle le script.
cd "$(dirname "$0")"

echo "=== Tests backend (Maven / Quarkus) ==="
mvn -s settings.xml clean test --batch-mode

echo "=== Tests frontend (Vitest) ==="
cd front
# `npm ci` (installe exactement le package-lock) seulement si besoin.
[ -d node_modules ] || npm ci
npm test
