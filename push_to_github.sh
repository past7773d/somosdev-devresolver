#!/usr/bin/env bash
# Pastana Dynamics — Script de Envio ao GitHub
# Autor: pastana7773d@gmail.com

set -e

TOKEN="$1"

if [ -z "$TOKEN" ]; then
  echo "Uso: ./push_to_github.sh SEU_GITHUB_PERSONAL_ACCESS_TOKEN"
  echo "Ou configure via SSH / git push origin main"
  exit 1
fi

REPO_URL="https://pastana7773d:${TOKEN}@github.com/pastana7773d/somosdev-devresolver.git"

echo "Configurando remote autenticado..."
git remote set-url origin "$REPO_URL"

echo "Enviando branch main para o GitHub..."
git push -u origin main

echo "Código enviado com sucesso ao GitHub!"
