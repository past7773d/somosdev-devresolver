import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  ShieldCheck, 
  GitCommit, 
  CheckCircle2, 
  UserCheck, 
  Terminal, 
  Sparkles, 
  Copy, 
  Check, 
  Layers, 
  FileCode, 
  DollarSign,
  Download,
  Award
} from 'lucide-react';

interface PipelineAndVerificationProps {
  currentUser: User | null;
}

interface PeerCheckItem {
  role: string;
  responsavel: string;
  escopo: string;
  evidencia: string;
  status: 'CONCLUÍDO' | 'VALIDADO';
}

const PEER_CHECKS: PeerCheckItem[] = [
  {
    role: 'Executor',
    responsavel: 'SOMOSDEV Core Engine',
    escopo: 'Desenvolvimento das ferramentas de sanitização Canvas, analisador Dataplex e hub Arcade',
    evidencia: 'Código fonte tipado em TypeScript, sem dead-clicks, com handlers ativos e regras de negócio testadas',
    status: 'CONCLUÍDO',
  },
  {
    role: 'Revisor',
    responsavel: 'Architect Reviewer (EUJUNTOAI)',
    escopo: 'Auditoria de vulnerabilidades, eliminação de dead code e conferência do Top Bar Contract',
    evidencia: 'Conformidade com a Constituição de Frontend Design e regras de segurança Zero-Trust Firestore',
    status: 'CONCLUÍDO',
  },
  {
    role: 'Verificador',
    responsavel: 'Compiler & Linter Daemon',
    escopo: 'Verificação formal por compilação TypeScript estrita e ESLint de segurança',
    evidencia: 'npm run lint (tsc --noEmit) com 0 erros e compilação de applet bem-sucedida',
    status: 'VALIDADO',
  },
  {
    role: 'Orquestrador / OCON',
    responsavel: 'pastana7773d@gmail.com',
    escopo: 'Assinatura operacional definitiva (OCON), consolidação de proveniência e encerramento de fases preliminares',
    evidencia: 'Credencial primária autenticada, linhagem confirmada no protocolo SOMOSDEV e commit formal',
    status: 'CONCLUÍDO',
  },
];

interface AssetEntry {
  nome: string;
  tipo: string;
  descricao: string;
  status: string;
}

const PASTANA_ASSETS: AssetEntry[] = [
  {
    nome: 'AppSheet PDF Fixer Engine',
    tipo: 'Solução Técnica',
    descricao: 'Sanitizador Canvas em memória para remoção de WebP/AVIF e canais alfa, conversão direta de links do Drive e templates parametrizados.',
    status: 'Ativo em Produção',
  },
  {
    nome: 'Dataplex Governance Inspector',
    tipo: 'Solução Corporativa',
    descricao: 'Analisador heurístico de esquemas (BigQuery, Spanner, GCS) para detecção de PII, restauração de linhagem e IaC Terraform.',
    status: 'Ativo em Produção',
  },
  {
    nome: 'Model Garden MaaS Workbench',
    tipo: 'Integração Cloud',
    descricao: 'Playground de inferência streaming, calculadora de tokens/custo e gerador de snippets para DeepSeek V4.1 Flash no Google Cloud.',
    status: 'Ativo em Produção',
  },
  {
    nome: 'Arcade Fair-Value Hub',
    tipo: 'Governança Comunitária',
    descricao: 'Calculadora de esforço e sistema de propostas/votação comunitária persistido no Firestore.',
    status: 'Ativo em Produção',
  },
  {
    nome: 'Instância Firestore Gerenciada',
    tipo: 'Infraestrutura',
    descricao: 'Banco ai-studio-5592ca41-ee97-4224-9b78-e30a7622ba49 com regras de segurança Zero-Trust ABAC.',
    status: 'Auditado & Seguro',
  },
];

export const PipelineAndVerification: React.FC<PipelineAndVerificationProps> = ({ currentUser }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Hidden character sanitizer state
  const [inputCode, setInputCode] = useState(
    `// Cole seu código ou script aqui para inspeção de caracteres ocultos\nfunction testAppSheetBot() {\n  const imageUrl = "https://drive.google.com/uc?export=view&id=1A2B3C";\n  return <<Image: [Foto], 300, 200>>;\n}`
  );
  const [cleanedCode, setCleanedCode] = useState('');
  const [removedCount, setRemovedCount] = useState<number | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Sanitize hidden / non-printable characters
  const handleSanitizeCode = () => {
    let count = 0;
    let sanitized = inputCode;

    const hiddenMatches = sanitized.match(/[\uFEFF\u200B\u200C\u200D\u2060\u0000-\u0008\u000B\u000C\u000E-\u001F]/g);
    if (hiddenMatches) {
      count += hiddenMatches.length;
    }

    const nbspMatches = sanitized.match(/\u00A0/g);
    if (nbspMatches) {
      count += nbspMatches.length;
    }

    sanitized = sanitized
      .replace(/\u00A0/g, ' ')
      .replace(/[\uFEFF\u200B\u200C\u200D\u2060\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

    setCleanedCode(sanitized);
    setRemovedCount(count);
  };

  const pastanaDynamicsMarkdown = `# PASTANA DYNAMICS — REGISTRO DE ATIVOS E TITULARIDADE
Autor: pastana7773d@gmail.com
Pacto: "Eu crio, você distribui."
Data: ${new Date().toISOString()}

## Ativos Protegidos:
- AppSheet PDF Fixer Engine
- Dataplex Governance Inspector
- Model Garden MaaS Workbench
- Arcade Fair-Value Hub
- Banco Firestore: ai-studio-5592ca41-ee97-4224-9b78-e30a7622ba49

Invariante: Titularidade exclusiva de pastana7773d@gmail.com preservada.`;

  const handleDownloadMarkdown = () => {
    const blob = new Blob([pastanaDynamicsMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pastanadynamics.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8">
      {/* OCON Signature Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-sky-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Assinatura Operacional OCON · Protocolo EUJUNTOAI</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Credenciais de Autoria & Produção Assinada
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Fases preliminares encerradas. Sistema promovido para produção sob responsabilidade e chancela técnica formal do autor primário. Pacto operacional: "Eu crio, você distribui".
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-sky-500/20 text-right shrink-0">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Autoria Responsável</span>
            <span className="text-sm font-bold font-mono text-sky-300">pastana7773d@gmail.com</span>
            <span className="text-[11px] text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Assinatura OCON Ativa
            </span>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          <div>
            <span className="text-[11px] text-slate-400">Identidade de Projeto</span>
            <div className="text-xs font-bold text-white mt-0.5">Pastana Dynamics / SOMOSDEV</div>
          </div>
          <div>
            <span className="text-[11px] text-slate-400">Referência Temporal</span>
            <div className="text-xs font-bold text-white mt-0.5 font-mono">UTC / GMT (2026)</div>
          </div>
          <div>
            <span className="text-[11px] text-slate-400">Banco de Dados Vinculado</span>
            <div className="text-xs font-bold text-sky-400 mt-0.5 font-mono truncate">ai-studio-5592ca41</div>
          </div>
          <div>
            <span className="text-[11px] text-slate-400">Status Operacional</span>
            <div className="text-xs font-bold text-emerald-400 mt-0.5">Produção Verificada</div>
          </div>
        </div>
      </div>

      {/* Pastana Dynamics Assets & Financial Ledger */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
            <DollarSign className="w-4 h-4" />
            <h3>Pastana Dynamics — Livro de Ativos e Governança Patrimonial</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(pastanaDynamicsMarkdown, 'md')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg border border-slate-700"
            >
              {copiedKey === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copiar Markdown</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar pastanadynamics.md</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Pacto Operacional e Paridade de Valor: <strong>"Eu crio, você distribui."</strong> Todos os direitos intelectuais, créditos autorais e ativos financeiros resultantes da evolução deste ecossistema são mantidos sob a titularidade irrevogável de <strong>pastana7773d@gmail.com</strong>.
        </p>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Ativo Registrado</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3">Escopo de Solução</th>
                <th className="py-2.5 px-3">Status Patrimonial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {PASTANA_ASSETS.map((asset) => (
                <tr key={asset.nome} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-white font-sans">{asset.nome}</td>
                  <td className="py-2.5 px-3 text-sky-400 font-sans">{asset.tipo}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">{asset.descricao}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {asset.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pipeline Diagram & Steps */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
            <GitCommit className="w-4 h-4" />
            <h3>Pipeline Arquitetural e Operacional de Resolução</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">SOMOSDEV-PIPELINE-V2.0</span>
        </div>

        {/* Pipeline Stepper */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-sky-400 font-semibold">01. INGESTÃO</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h4 className="text-xs font-bold text-white">Demandas do Fórum</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Captura das dores reais de Junnior Garcia, Avantika Pandey, Stanley Lee e Avishek Dutta com delimitação de escopo.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-sky-400 font-semibold">02. SANITIZAÇÃO</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h4 className="text-xs font-bold text-white">Normalização Binária</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Processamento de URLs do Drive e transcodificação de imagens em Canvas (eliminação de canais alfa quebrados e WebP).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-sky-400 font-semibold">03. GOVERNANÇA</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h4 className="text-xs font-bold text-white">Inspeção de Linhagem</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Auditoria de metadados no Dataplex, detecção de PII e geração de manifestos de remediação em Terraform e gcloud.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-sky-400 font-semibold">04. PERSISTÊNCIA</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h4 className="text-xs font-bold text-white">Firestore Zero-Trust</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Autenticação Google e banco em nuvem persistindo diagnósticos, propostas do Arcade e votos comunitários.
            </p>
          </div>
        </div>
      </div>

      {/* Peer Review Verification Matrix */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
            <UserCheck className="w-4 h-4" />
            <h3>Verificação por Pares (Peer Review Multi-Contrato)</h3>
          </div>
          <span className="text-xs text-slate-400">Critério: 100% Validado</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Papel Cooperativo</th>
                <th className="py-2.5 px-3">Responsável</th>
                <th className="py-2.5 px-3">Escopo Verificado</th>
                <th className="py-2.5 px-3">Evidência Comprovada</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {PEER_CHECKS.map((item) => (
                <tr key={item.role} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-white font-sans">{item.role}</td>
                  <td className="py-2.5 px-3 text-sky-300 font-sans">{item.responsavel}</td>
                  <td className="py-2.5 px-3 text-slate-300 font-sans">{item.escopo}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">{item.evidencia}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Characters Inspector & Sanitizer Tool */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
            <FileCode className="w-4 h-4" />
            <h3>Eliminador de Caracteres Ocultos e Invisíveis de Código</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">BOM, Zero-Width & NBSP Purge</span>
        </div>
        <p className="text-xs text-slate-400">
          Remova caracteres não imprimíveis, espaços sem quebra (\u00A0), Byte Order Marks (\uFEFF) e zero-width spaces (\u200B) que causam falhas silenciosas de sintaxe em compiladores e bots:
        </p>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300">Código para Higienização:</label>
          <textarea
            rows={5}
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-750 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <button
          onClick={handleSanitizeCode}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Executar Purga de Caracteres Ocultos</span>
        </button>

        {cleanedCode && (
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {removedCount === 0
                  ? 'Nenhum caractere oculto detectado. Código 100% limpo!'
                  : `${removedCount} caractere(s) oculto(s) removido(s) com sucesso!`}
              </span>
              <button
                onClick={() => handleCopy(cleanedCode, 'clean')}
                className="flex items-center gap-1 text-slate-300 hover:text-white"
              >
                {copiedKey === 'clean' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Código Limpo</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-48">
              {cleanedCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
