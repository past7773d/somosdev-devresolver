#!/usr/bin/env bash
# Pastana Dynamics — Script de Envio ao GitHub
# Autor: pastana7773d@gmail.com
# Repositório Oficial: https://github.com/past7773d/somosdev-devresolver

set -e

TOKEN="$1"

if [ -z "$TOKEN" ]; then
  echo "Uso: ./push_to_github.sh SEU_GITHUB_PERSONAL_ACCESS_TOKEN"
  echo "Exemplo: ./push_to_github.sh ghp_xxxxxxxxxxxxxxxxxxxx"
  exit 1
fi

REPO_URL="https://past7773d:${TOKEN}@github.com/past7773d/somosdev-devresolver.git"

echo "Configurando remote autenticado para past7773d..."
git remote set-url origin "$REPO_URL"

echo "Enviando branch main para o GitHub..."
git push -u origin main

echo "Código enviado com sucesso ao GitHub!"
