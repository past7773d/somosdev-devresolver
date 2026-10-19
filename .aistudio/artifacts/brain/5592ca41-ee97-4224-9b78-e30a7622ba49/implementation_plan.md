# SOMOSDEV DevResolver — Central de Soluções e Resolução Google Developer

Uma plataforma unificada e interativa projetada para resolver com rigor técnico e evidências reais as dores críticas relatadas pela comunidade de desenvolvedores nos Fóruns do Google Developer: diagnóstico e sanitização para o erro de imagens em PDFs do AppSheet Bot, auditoria de governança de metadados agenciais no Google Cloud Dataplex, playground de integração para o DeepSeek V4.1 Flash no Model Garden, e um portal de governança e reivindicações de recompensas justas para o Google Cloud Arcade, potencializado por autenticação Google e persistência em nuvem via Firestore.

## Decisões Críticas e Preferências do Usuário

> [!IMPORTANT]
> As escolhas arquiteturais foram alinhadas com as diretrizes do protocolo SOMOSDEV / EUJUNTOAI e com as preferências confirmadas na Fase de Clarificação:

- **Decisão Confirmada 1 (AppSheet Bot PDF)**: Diagnóstico interativo em tempo real com sanitizador de formatos de imagem (WebP/AVIF para PNG/JPEG, normalização de proporções e EXIF, detecção de URLs do Google Drive para visualização direta) acoplado a um gerador de templates limpos do Google Docs/AppSheet (`<<Image: [Coluna], 300, 200>>`).
- **Decisão Confirmada 2 (Autenticação e Firestore)**: Autenticação via Google Sign-In com Firebase Auth, permitindo aos desenvolvedores salvar históricos de diagnósticos, exportar relatórios técnicos, votar em propostas comunitárias e acompanhar o status de tickets de resolução.
- **Decisão Confirmada 3 (Escopo Multi-Problema)**: Abordagem holística cobrindo simultaneamente os quatro grandes tópicos do fórum (AppSheet PDF, Dataplex Governance, Model Garden DeepSeek e Resolução do Google Cloud Arcade).

---

## 1. Visão Geral e Conceito Central

### O Que a Solução Faz
A aplicação **SOMOSDEV DevResolver** atua como uma central de engenharia e resolução em produção para os problemas relatados pelos desenvolvedores nos fóruns do Google:
1. **AppSheet Bot PDF Image Fixer**: Resolve o erro de Junnior Garcia (`"Erro de Formato de Imagen, que no permite generar PDF desde el BOT"`). Fornece upload e teste de imagem, sanitização de MIME types conflitantes (remoção de canais alfa quebrados, conversão de WebP/AVIF incompatíveis com o motor do Google Docs para JPEG/PNG de alta densidade), conversor de links do Google Drive para o formato compatível com o bot (`drive.google.com/uc?export=view&id=...`), e geração do trecho exato de template.
2. **Knowledge Catalog & Dataplex Governance Inspector**: Aborda o artigo de Avantika Pandey com um analisador de esquemas e linhagens que detecta lacunas de governança, identifica colunas de PII não classificadas (CPF, e-mail, cartão, endereço), mapeia tags de políticas e gera scripts automatizados em Terraform e Python/gcloud para remediação.
3. **Model Garden & Vertex AI MaaS Workbench**: Atende à demanda de Stanley Lee com um simulador prático e gerador de código para invocação do modelo totalmente gerenciado DeepSeek V4.1 Flash no Model Garden / Gemini, com cálculo de latência, precificação e snippets de código funcionais.
4. **Arcade Swag Fair-Value & Petition Hub**: Dá resposta direta à frustração de Avishek Dutta, Roshan2, Rehaan Kaushar e outros desenvolvedores. Possui uma calculadora de esforço vs. utilidade (pontos acumulados, horas gastas em labs e cursos vs. valor real dos brindes), com sistema de votação comunitária autenticada para reivindicações concretas (ex: mini impressora térmica para anotações, SSDs portáteis, vouchers de certificação Cloud).

### Público-Alvo
- Desenvolvedores Google Cloud, criadores de soluções AppSheet, engenheiros de dados e participantes ativos do ecossistema Google Arcade.

### Valor Principal
Transformar reclamações e erros travados no fórum em **ferramentas executáveis**, código testado, templates prontos e reivindicações organizadas com persistência de dados real.

---

## 2. Experiência do Usuário e Design Visual

### Fluxos Principais
1. **Visão Geral do Hub**: O usuário acessa a plataforma e visualiza o feed de problemas ativos com contadores de resolução, status e badges de prioridade técnica.
2. **Resolução AppSheet PDF**:
   - O dev seleciona a aba "AppSheet PDF Fixer".
   - Insere a URL da imagem ou faz upload de um arquivo suspeito.
   - O sanitizador analisa: formato (detecta WebP/AVIF/SVG não suportados pelo rasterizador do PDF), dimensões em pixels, tamanho do arquivo e estrutura da URL do Google Drive.
   - O dev clica em "Sanitizar e Gerar Template": a ferramenta gera a imagem sanitizada convertida para PNG/JPEG, fornece download imediato e produz a sintaxe exata do template do Google Docs (`<<Image: [Foto], 400, 300>>`).
   - Usuário autenticado pode salvar o diagnóstico diretamente no seu histórico no Firestore.
3. **Auditoria de Governança Dataplex**:
   - O dev insere um esquema de tabela (JSON/DDL) ou escolhe modelos pré-carregados (BigQuery, Spanner, Cloud Storage).
   - O motor identifica riscos de decaimento de catálogo, colunas PII desprotegidas e ausência de tags de retenção.
   - Gera um manifesto de conformidade e script de remediação `gcloud dataplex policy-tags` ou Terraform.
4. **Hub de Reivindicações Google Arcade**:
   - O dev insere seus pontos acumulados (ex: 120 pontos) e visualiza o cálculo de paridade de esforço.
   - Vota e subscreve propostas da comunidade (ex: "Mini Impressora Térmica para Níveis Champion/Legend", "SSD Portátil 1TB").
   - Adiciona novas propostas técnicas para avaliação do time de comunidade.

### Identidade Visual e Tema
- **Estilo**: Engenharia moderna, sóbria e refinada (Enterprise Developer Console).
- **Paleta de Cores (60-30-10)**:
  - Fundo principal (60%): Slate escuro profundo (`#0B0F17`) ou branco estruturado (`#F8FAFC`).
  - Superfícies e cartões (30%): Fundo técnico neutro com bordas sutis hairline (`#1E293B` / `border-slate-800`), sem empilhamento excessivo de cartões.
  - Acentos funcionais (10%): Azul Google Developer (`#1A73E8` / `#38BDF8`), Verde de sucesso/resolução (`#10B981`) e Âmbar de aviso de governança (`#F59E0B`).
- **Tipografia**:
  - Títulos e interface: `Plus Jakarta Sans` ou `Outfit` para clareza e autoridade técnica.
  - Código, métricas e identificadores: `font-mono tabular-nums` (`JetBrains Mono` / `Space Mono`).
- **Disciplina Visual**:
  - Zero pílulas genéricas estáticas: metadados separados por caracteres sutis (`·`, `/`).
  - Controles de aba interativos e funcionais com estados ativos claros.
  - Nenhum botão ou link sem manipulador funcional.

---

## 3. Decisões do Produto e Trade-Offs

- **Sanitização de Imagens no Cliente**:
  - *Decisão*: Utilizar HTML5 Canvas API e Blob API diretamente no navegador para processar, redimensionar, remover canais problemáticos e converter formatos de imagens (WebP -> PNG/JPEG) sem sobrecarregar a latência de upload em servidores intermediários.
  - *Vantagem*: Execução instantânea para o desenvolvedor, privacidade de dados e conformidade com os limites do AppSheet.
- **Persistência com Firebase Auth e Firestore**:
  - *Decisão*: Integrar Firebase Auth com Google Sign-In e coleção Firestore para salvar diagnósticos e votos do Arcade.
  - *Vantagem*: Atende 100% às instruções da tarefa com banco em tempo real, controle de regras seguras e dados auditáveis sob o protocolo SOMOSDEV.
- **Exportação de Soluções**:
  - *Decisão*: Permitir cópia em 1 clique e download em arquivos `.txt`, `.json` e `.gs` (Google Apps Script).

---

## 4. Arquitetura Técnica e Estratégia de Dados

### Diagrama da Arquitetura do Sistema

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SOMOSDEV DevResolver UI                         │
│   (Top Bar com Breadcrumbs, Google Sign-In e Seletor de Resoluções)    │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
       ┌─────────────────────────────┼─────────────────────────────┐
       ▼                             ▼                             ▼
┌───────────────┐           ┌─────────────────┐           ┌─────────────────┐
│ AppSheet PDF  │           │ Dataplex Policy │           │ Arcade Dev Swag │
│ Image Fixer   │           │ & PII Auditor   │           │ Resolution Hub  │
│ - Mime Inspect│           │ - Schema Parser │           │ - Effort Calc   │
│ - Canvas Conv │           │ - PII Detector  │           │ - Petition Feed │
│ - URL Fixer   │           │ - IaC / CLI Gen │           │ - Upvote Engine │
└───────┬───────┘           └────────┬────────┘           └────────┬────────┘
        │                            │                             │
        └────────────────────────────┼─────────────────────────────┘
                                     ▼
                  ┌──────────────────────────────────────┐
                  │          Firebase Services           │
                  │  - Firebase Auth (Google Sign-In)    │
                  │  - Firestore DB (blueprint & rules)  │
                  │    • /users/{uid}                    │
                  │    • /diagnostics/{diagId}           │
                  │    • /arcade_proposals/{propId}      │
                  │    • /arcade_votes/{voteId}          │
                  └──────────────────────────────────────┘
```

### Modelo de Dados Firestore (`firebase-blueprint.json`)

1. **`users/{userId}`**:
   - `id`: string
   - `displayName`: string
   - `email`: string
   - `photoURL`: string (opcional)
   - `createdAt`: timestamp
2. **`diagnostics/{diagnosticId}`**:
   - `id`: string
   - `userId`: string
   - `toolType`: string (`appsheet_pdf`, `dataplex_catalog`, `model_garden`)
   - `title`: string
   - `inputSummary`: string
   - `resultSummary`: string
   - `sanitizedCode`: string
   - `createdAt`: timestamp
3. **`arcade_proposals/{proposalId}`**:
   - `id`: string
   - `userId`: string
   - `authorName`: string
   - `title`: string (ex: "Mini Impressora Térmica para notas e checklists")
   - `targetTier`: string (`Champion`, `Legend`, `All`)
   - `description`: string
   - `estimatedEffortPoints`: number
   - `voteCount`: number
   - `status`: string (`proposed`, `under_review`, `validated`)
   - `createdAt`: timestamp
4. **`arcade_votes/{voteId}`**:
   - `id`: string
   - `proposalId`: string
   - `userId`: string
   - `createdAt`: timestamp

### Mapeamento de Componentes e Estados
- `App.tsx`: Gerenciador de navegação e layout de console de desenvolvedor.
- `components/Navbar.tsx`: Barra superior conforme contrato de design (Logotipo SOMOSDEV DevResolver, navegação de tópicos, status de autenticação Google).
- `components/AppSheetPdfSolver.tsx`: Ferramenta interativa de diagnóstico com upload de imagem, teste de URL de Drive, conversão Canvas (RGBA -> JPEG/PNG), validador de proporção e gerador de sintaxe de template.
- `components/DataplexGovernanceSolver.tsx`: Motor de análise de decaimento de catálogo, classificador heurístico de PII e gerador de comandos de remediação Google Cloud.
- `components/ModelGardenWorkbench.tsx`: Playground de integração DeepSeek V4.1 Flash no Vertex AI / Model Garden, cálculo de custos e snippet executável.
- `components/ArcadeResolutionHub.tsx`: Calculadora de paridade de esforço em pontos do Arcade, lista de propostas com votação em tempo real e formulário de submissão de demandas para a equipe do Google.
- `services/firebase.ts`: Inicialização defensiva do Firebase SDK com carregamento de configuração e captura padronizada de erros (`handleFirestoreError`).

---

## 5. Próximos Passos na Execução (Fase 3)

1. Provisionar o Firebase Firestore e Authentication via fluxo oficial `show_aistudio_ui` / `rpc_action`.
2. Criar `firebase-blueprint.json` e as regras de segurança `firestore.rules` seguindo o modelo Zero-Trust.
3. Instalar pacotes necessários (como `firebase`).
4. Implementar os módulos funcionais com ferramentas interativas e testadas, sem stubs ou cliques vazios.
5. Validar a compilação completa com `compile_applet`.
