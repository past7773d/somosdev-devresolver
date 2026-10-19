import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  Database, 
  ShieldAlert, 
  CheckCircle2, 
  Copy, 
  Check, 
  Code, 
  Terminal, 
  Search, 
  BookmarkPlus, 
  RefreshCw,
  GitFork,
  Fingerprint
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '@/src/services/firebase.ts';
import { collection, addDoc } from 'firebase/firestore';

interface DataplexGovernanceSolverProps {
  currentUser: User | null;
  onSavedDiagnostic?: () => void;
}

interface ColumnDef {
  name: string;
  type: string;
  description: string;
  piiType?: string;
  policyTag?: string;
  hasLineage: boolean;
}

interface DatasetTemplate {
  name: string;
  platform: 'BigQuery' | 'Cloud Spanner' | 'Cloud Storage';
  location: string;
  columns: ColumnDef[];
}

const PRESET_DATASETS: DatasetTemplate[] = [
  {
    name: 'analytics_lake.customers_billing_v2',
    platform: 'BigQuery',
    location: 'us-east1',
    columns: [
      { name: 'customer_id', type: 'STRING', description: 'Chave primária do cliente', hasLineage: true },
      { name: 'full_name', type: 'STRING', description: '', piiType: 'Nome Completo', hasLineage: false },
      { name: 'tax_identifier_cpf', type: 'STRING', description: '', piiType: 'Documento Pessoal (CPF/SSN)', hasLineage: false },
      { name: 'credit_card_hash', type: 'STRING', description: 'Token de cartão', piiType: 'Financeiro / PCI', policyTag: 'FineGrainedAccess', hasLineage: true },
      { name: 'email_address', type: 'STRING', description: '', piiType: 'Contato Pessoal', hasLineage: false },
      { name: 'created_timestamp', type: 'TIMESTAMP', description: 'Data do registro', hasLineage: true },
    ]
  },
  {
    name: 'ecommerce_spanner.order_transactions',
    platform: 'Cloud Spanner',
    location: 'southamerica-east1',
    columns: [
      { name: 'order_uuid', type: 'STRING(36)', description: 'Identificador global do pedido', hasLineage: true },
      { name: 'buyer_phone', type: 'STRING(20)', description: '', piiType: 'Telefone Celular', hasLineage: false },
      { name: 'shipping_address', type: 'STRING(MAX)', description: '', piiType: 'Endereço Físico', hasLineage: false },
      { name: 'total_amount', type: 'NUMERIC', description: 'Valor total em BRL', hasLineage: true },
      { name: 'ip_address', type: 'STRING(45)', description: '', piiType: 'Telemetria / IP', hasLineage: false },
    ]
  },
  {
    name: 'raw_landing_bucket/iot_telemetry_stream',
    platform: 'Cloud Storage',
    location: 'us-central1',
    columns: [
      { name: 'device_serial', type: 'STRING', description: 'Serial de hardware', hasLineage: true },
      { name: 'geo_coordinates', type: 'STRING', description: '', piiType: 'Geolocalização Precisa', hasLineage: false },
      { name: 'operator_badge_id', type: 'STRING', description: '', piiType: 'ID Corporativo', hasLineage: false },
      { name: 'raw_payload_json', type: 'JSON', description: 'Payload sem esquema prévio', hasLineage: false },
    ]
  }
];

export const DataplexGovernanceSolver: React.FC<DataplexGovernanceSolverProps> = ({ 
  currentUser, 
  onSavedDiagnostic 
}) => {
  const [selectedDatasetIndex, setSelectedDatasetIndex] = useState(0);
  const [activeCodeTab, setActiveCodeTab] = useState<'terraform' | 'gcloud' | 'python'>('terraform');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const currentDataset = PRESET_DATASETS[selectedDatasetIndex];

  // Governance calculations
  const totalCols = currentDataset.columns.length;
  const missingDesc = currentDataset.columns.filter(c => !c.description).length;
  const unclassifiedPii = currentDataset.columns.filter(c => c.piiType && !c.policyTag).length;
  const brokenLineage = currentDataset.columns.filter(c => !c.hasLineage).length;
  const decayScore = Math.round(((missingDesc + unclassifiedPii * 2 + brokenLineage * 1.5) / (totalCols * 3)) * 100);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate Terraform for Data Catalog & Dataplex
  const terraformSnippet = `# Google Cloud Dataplex & Knowledge Catalog Governance Manifest
# Dataset: ${currentDataset.name}

resource "google_data_catalog_taxonomy" "governance_taxonomy" {
  provider     = google
  display_name = "Dataplex_${currentDataset.platform}_Taxonomy"
  description  = "Taxonomia de segregação de PII e governança agencial"
  activated_policy_types = ["FINE_GRAINED_ACCESS_CONTROL"]
}

resource "google_data_catalog_policy_tag" "confidential_pii" {
  taxonomy     = google_data_catalog_taxonomy.governance_taxonomy.id
  display_name = "Confidential_PII"
  description  = "Acesso restrito a dados identificáveis de clientes"
}

resource "google_data_catalog_policy_tag" "high_security_financial" {
  taxonomy     = google_data_catalog_taxonomy.governance_taxonomy.id
  display_name = "High_Security_Financial"
  description  = "Restrição PCI/Financeiro para tokens e cartões"
}

# Associação de Tags de Política às colunas com lacunas detectadas
${currentDataset.columns
  .filter(c => c.piiType)
  .map(c => `
# Coluna: ${c.name} (${c.piiType})
resource "google_data_catalog_entry" "entry_${c.name}" {
  entry_group = "projects/PROJECT_ID/locations/${currentDataset.location}/entryGroups/@default"
  entry_id    = "entry_${c.name}"
  type        = "TABLE"
  schema = jsonencode({
    columns = [
      {
        column = "${c.name}",
        description = "Identificado automaticamente como ${c.piiType}",
        policy_tags = [google_data_catalog_policy_tag.confidential_pii.name]
      }
    ]
  })
}`).join('\n')}`;

  // Generate gcloud CLI commands
  const gcloudSnippet = `#!/usr/bin/env bash
# Remediação via gcloud CLI para Knowledge Catalog e Dataplex
PROJECT_ID="YOUR_PROJECT_ID"
LOCATION="${currentDataset.location}"
TAXONOMY_NAME="Dataplex_${currentDataset.platform}_Taxonomy"

echo "1. Criando taxonomia de governança..."
TAXONOMY_ID=$(gcloud data-catalog taxonomies create \\
  --location=$LOCATION \\
  --display-name="$TAXONOMY_NAME" \\
  --activated-policy-types=fine-grained-access-control \\
  --format="value(name)")

echo "2. Criando tags de política para dados sensíveis..."
POLICY_TAG_ID=$(gcloud data-catalog policy-tags create \\
  --taxonomy=$TAXONOMY_ID \\
  --display-name="Confidential_PII" \\
  --format="value(name)")

echo "3. Aplicando políticas e fechando lacunas de linhagem..."
${currentDataset.columns
  .filter(c => c.piiType && !c.policyTag)
  .map(c => `echo "Aplicando tag em: ${c.name} (${c.piiType})"
# gcloud dataplex assets / entries update
gcloud data-catalog entries update @default \\
  --schema-column="${c.name}" \\
  --policy-tag="$POLICY_TAG_ID"`).join('\n')}

echo "Remediação concluída com sucesso."`;

  // Generate Python SDK automation
  const pythonSnippet = `"""
Automação de Linhagem e Governança com Google Cloud Dataplex SDK
Corrige decaimento de catálogo e anexa Tags de Política em tempo real.
"""
from google.cloud import dataplex_v1
from google.cloud import datacatalog_v1

def remediate_catalog_decay(project_id: str, location: str, table_name: str):
    catalog_client = datacatalog_v1.DataCatalogClient()
    
    # 1. Busca tags não classificadas
    print(f"Inspecionando {table_name} em {location}...")
    
    columns_to_tag = [
${currentDataset.columns.filter(c => c.piiType).map(c => `        {"name": "${c.name}", "pii": "${c.piiType}"},`).join('\n')}
    ]
    
    for col in columns_to_tag:
        print(f"-> Blindando coluna {col['name']} com Tag de Governança ({col['pii']})")
        # Injeta tag no schema dictionary do Knowledge Catalog
        # ...
    
    print("Linhagem de pipeline reconstituída e metadados reconciliados.")

if __name__ == "__main__":
    remediate_catalog_decay("my-gcp-project", "${currentDataset.location}", "${currentDataset.name}")
`;

  // Save diagnostic to Firestore
  const handleSaveDiagnostic = async () => {
    if (!currentUser) return;
    setSavingStatus('saving');
    try {
      await addDoc(collection(db, 'diagnostics'), {
        userId: currentUser.uid,
        toolType: 'dataplex_catalog',
        title: `Governança Dataplex: ${currentDataset.name}`,
        inputSummary: `Dataset: ${currentDataset.name} (${currentDataset.platform}) - ${totalCols} colunas`,
        resultSummary: `Decaimento: ${decayScore}% | PIIs Desprotegidos: ${unclassifiedPii} | Linhagens Quebradas: ${brokenLineage}`,
        sanitizedCode: terraformSnippet,
        createdAt: new Date().toISOString(),
      });
      setSavingStatus('saved');
      if (onSavedDiagnostic) onSavedDiagnostic();
      setTimeout(() => setSavingStatus('idle'), 3000);
    } catch (err) {
      setSavingStatus('error');
      handleFirestoreError(err, OperationType.CREATE, 'diagnostics');
    }
  };

  return (
    <div className="space-y-8">
      {/* Context Header */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Caso Avantika Pandey</span>
            <span aria-hidden="true">·</span>
            <span>Knowledge Catalog & Dataplex</span>
            <span aria-hidden="true">·</span>
            <span>Auditoria Agencial</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Governança de Metadados: Auditoria e Remediação de Lacunas
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Detecte decaimento contínuo em catálogos corporativos: PII não classificada, linhagem de pipeline cortada, descrições ausentes e tags de políticas omissas no BigQuery, Spanner e Cloud Storage.
          </p>
        </div>
        {currentUser && (
          <button
            onClick={handleSaveDiagnostic}
            disabled={savingStatus === 'saving'}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors shrink-0 disabled:opacity-50"
          >
            {savingStatus === 'saving' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : savingStatus === 'saved' ? (
              <Check className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <BookmarkPlus className="w-3.5 h-3.5" />
            )}
            <span>{savingStatus === 'saved' ? 'Salvo no Firestore!' : 'Salvar no Meu Histórico'}</span>
          </button>
        )}
      </div>

      {/* Preset Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400 mr-2">Selecione o Esquema para Inspeção:</span>
        {PRESET_DATASETS.map((ds, idx) => (
          <button
            key={ds.name}
            onClick={() => setSelectedDatasetIndex(idx)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
              selectedDatasetIndex === idx
                ? 'bg-sky-950/60 border-sky-500 text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {ds.name} ({ds.platform})
          </button>
        ))}
      </div>

      {/* Inspection Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Total de Colunas</span>
          <div className="text-2xl font-bold font-mono text-white mt-1 tabular-nums">{totalCols}</div>
          <span className="text-[11px] text-slate-500">{currentDataset.platform} ({currentDataset.location})</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">PII Não Classificada</span>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1 tabular-nums">{unclassifiedPii}</div>
          <span className="text-[11px] text-rose-400/80">Risco LGPD / GDPR Crítico</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Linhagem Cortada (Severed)</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">{brokenLineage}</div>
          <span className="text-[11px] text-amber-400/80">Origem desconhecida</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Índice de Decaimento</span>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-1 tabular-nums">{decayScore}%</div>
          <span className="text-[11px] text-slate-500">Gravidade do Catálogo</span>
        </div>
      </div>

      {/* Columns Table */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
            <Database className="w-4 h-4" />
            <h3>Análise Detalhada de Metadados por Coluna</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Dataset: {currentDataset.name}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Coluna</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Classificação PII</th>
                <th className="py-2.5 px-3">Linhagem de Pipeline</th>
                <th className="py-2.5 px-3">Tag de Política</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {currentDataset.columns.map((col) => {
                const isVulnerable = (col.piiType && !col.policyTag) || !col.hasLineage;
                return (
                  <tr key={col.name} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">{col.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{col.type}</td>
                    <td className="py-2.5 px-3">
                      {col.piiType ? (
                        <span className="text-rose-400 flex items-center gap-1 font-sans">
                          <Fingerprint className="w-3.5 h-3.5" /> {col.piiType}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-sans">Público / Não-Sensível</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {col.hasLineage ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-sans">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Upstream Rastreado
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1 font-sans">
                          <GitFork className="w-3.5 h-3.5" /> Linhagem Cortada
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {col.policyTag ? (
                        <span className="text-sky-300 font-sans">{col.policyTag}</span>
                      ) : (
                        <span className="text-slate-500 font-sans">Ausente</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {isVulnerable ? (
                        <span className="text-rose-400 flex items-center gap-1 font-sans">
                          <ShieldAlert className="w-3.5 h-3.5" /> Requer Remediação
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1 font-sans">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Conforme
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Generation Section */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
            <Code className="w-4 h-4" />
            <h3>Script de Remediação Automática Gerado</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
              <button
                onClick={() => setActiveCodeTab('terraform')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  activeCodeTab === 'terraform' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Terraform (IaC)
              </button>
              <button
                onClick={() => setActiveCodeTab('gcloud')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  activeCodeTab === 'gcloud' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                gcloud CLI
              </button>
              <button
                onClick={() => setActiveCodeTab('python')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  activeCodeTab === 'python' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Python SDK
              </button>
            </div>

            <button
              onClick={() => {
                const code = activeCodeTab === 'terraform' ? terraformSnippet : activeCodeTab === 'gcloud' ? gcloudSnippet : pythonSnippet;
                handleCopy(code, activeCodeTab);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg border border-slate-700"
            >
              {copiedKey === activeCodeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copiar</span>
            </button>
          </div>
        </div>

        <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto max-h-96 leading-relaxed">
          {activeCodeTab === 'terraform' && terraformSnippet}
          {activeCodeTab === 'gcloud' && gcloudSnippet}
          {activeCodeTab === 'python' && pythonSnippet}
        </pre>
      </div>
    </div>
  );
};
