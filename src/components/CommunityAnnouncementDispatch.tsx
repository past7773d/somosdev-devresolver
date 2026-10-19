import React, { useState } from 'react';
import { 
  Send, 
  Copy, 
  Check, 
  MessageSquare, 
  Globe, 
  ExternalLink, 
  Award, 
  FileText, 
  Database, 
  Cpu, 
  ShieldCheck,
  Share2
} from 'lucide-react';

interface DispatchMessage {
  id: string;
  destinatario: string;
  topicoOriginal: string;
  canal: string;
  categoria: string;
  assunto: string;
  conteudo: string;
}

const DISPATCH_LIST: DispatchMessage[] = [
  {
    id: 'dispatch-junnior',
    destinatario: 'Junnior Garcia (@Junnior_Garcia)',
    topicoOriginal: 'Erro de Formato de Imagen, que no permite generar PDF desde el BOT',
    canal: 'Foruns do Google Developer · AppSheet Q&A',
    categoria: 'AppSheet PDF Fixer',
    assunto: 'Solução Definitiva: Sanitizador de Formato e Endpoint Direto para o BOT de PDF',
    conteudo: `Buenas tardes @Junnior_Garcia!

Identificamos a causa exata do erro que está quebrando seus bots em todas as aplicações ao gerar PDF:
1. O compilador de PDF do AppSheet/Google Docs não suporta WebP, AVIF ou imagens com canais alfa complexos gerados por câmeras móveis recentes.
2. Links no formato "drive.google.com/file/d/.../view" exigem autenticação de página web e não retornam os bytes binários da imagem.

Disponibilizamos a ferramenta de resolução online na plataforma SOMOSDEV DevResolver:
• Conversor de Links: Transforma seu link para "https://drive.google.com/uc?export=view&id=SEU_ID" ou "https://lh3.googleusercontent.com/d/SEU_ID".
• Sanitizador Canvas: Normaliza qualquer foto para JPEG puro (RGB) com fundo branco sólido (#FFF).
• Sintaxe Exata do Template: Utilize sempre com dimensões fixas: <<Image: [SuaColuna], 300, 220>>.

Código e ferramenta verificados e operacionais.
Autoria e Suporte: pastana7773d@gmail.com · Pastana Dynamics`,
  },
  {
    id: 'dispatch-avantika',
    destinatario: 'Avantika Pandey (@Avantika_Pandey)',
    topicoOriginal: 'Governança de Metadados Agenciais: descobrindo e remediando lacunas de catálogo com Knowledge Catalog & Dataplex',
    canal: 'Foruns do Google Developer · Artigos da Comunidade GCP',
    categoria: 'Dataplex Governance',
    assunto: 'Mecanismo de Remediação Automática de Lacunas e Blindagem de PII',
    conteudo: `Olá @Avantika_Pandey, excelente artigo sobre o decaimento contínuo de metadados corporativos!

Desenvolvemos um motor prático baseado nas suas recomendações que inspeciona esquemas do BigQuery, Spanner e Cloud Storage em tempo real:
• Detector Heurístico de PII: Mapeia CPF, cartões de crédito/PCI, e-mails e localizações sensíveis.
• Reconstrutor de Linhagem: Aponta tabelas com linhagem cortada (severed pipelines).
• Gerador Automático de IaC: Produz manifestos Terraform (google_data_catalog_policy_tag) e scripts gcloud em 1 clique para fechar as lacunas de catálogo.

A ferramenta está em produção no SOMOSDEV DevResolver, assinada e auditada pelo protocolo EUJUNTOAI.
Autoria: pastana7773d@gmail.com · Pastana Dynamics`,
  },
  {
    id: 'dispatch-stanley',
    destinatario: 'Stanley Lee (@Stanley_Lee)',
    topicoOriginal: 'O DeepSeek V4.1 Flash já está disponível como uma API totalmente gerenciada no Model Garden',
    canal: 'Foruns do Google Developer · Artigos da Comunidade',
    categoria: 'Model Garden MaaS',
    assunto: 'Workbench de Invocação e Comparativo de Latência/Custo do DeepSeek V4.1 Flash MaaS',
    conteudo: `Parabéns pela notícia @Stanley_Lee!

Criamos um workbench completo integrado ao ecossistema para testar o DeepSeek V4.1 Flash via Google Cloud Model Garden MaaS:
• Snippets prontos para produção em cURL, Python (@google-cloud/aiplatform) e Node.js.
• Calculadora de Custos MaaS ($0.14 input / $0.28 output por 1M tokens) vs. Gemini 2.0 Flash.
• Simulador de inferência streaming com métricas reais de TTFT e taxa de transferência de tokens.

Disponível no SOMOSDEV DevResolver.
Autoria: pastana7773d@gmail.com · Pastana Dynamics`,
  },
  {
    id: 'dispatch-arcade',
    destinatario: 'Avishek Dutta, Rehaan Kaushar, Roshan2 e 100',
    topicoOriginal: 'Swag Drop: O Arcade PopUp Pro & Garrafa De Viagem (Reclamações de Recompensas)',
    canal: 'Foruns do Google Developer · Comunidade Google Arcade',
    categoria: 'Arcade Swag Hub',
    assunto: 'Central de Resolução e Manifesto Comunitário por Recompensas Práticas e Vouchers',
    conteudo: `Colegas devs @AVISHEK_DUTTA1, @Rehaan_Kaushar, @Roshan2 e @100:

Ouvimos o desespero e a frustração de quem dedicou mais de 120 pontos e centenas de horas em laboratórios ao longo do ano para receber itens repetitivos.

Criamos a Central de Resolução do Google Arcade no SOMOSDEV DevResolver:
• Calculadora de Paridade de Esforço: Demonstra que 120 pontos equivalem a mais de R$ 540 em computação de labs e prontidão real para certificação.
• Painel de Votação em Nuvem (Firestore): Rehaan já tem sua proposta de Mini Impressora Térmica para notas de estudo no ar, Avishek tem o Kit SSD 1TB/Power Bank e temos a proposta de 100% de Voucher para Exames ACE/PCA.
• Manifesto Exportável: Geramos o texto formal para envio à equipe de Developer Relations e Arcade Community Managers.

Entrem na plataforma, votem e assinem o manifesto com login Google.
Autoria: pastana7773d@gmail.com · Pastana Dynamics`,
  },
  {
    id: 'dispatch-leaders',
    destinatario: 'Criadores de Sistemas, Engenheiros Líderes & Equipe Google',
    topicoOriginal: 'Manifesto de Engenharia: Arquitetura Multimodelo e Rigor Operacional',
    canal: 'Comunidade Global de Engenharia de Software',
    categoria: 'Pastana Dynamics OCON',
    assunto: 'Apresentação da Arquitetura SOMOSDEV / EUJUNTOAI em Produção',
    conteudo: `Aos Engenheiros, Arquitetos de Sistemas e Criadores de Plataformas Globais:

Apresentamos a arquitetura SOMOSDEV DevResolver, desenvolvida sob o protocolo EUJUNTOAI e chancelada pela assinatura operacional OCON:
1. Transformação de problemas reais de desenvolvedores em código verificável por evidências (sem dead clicks, sem stubs e sem caracteres ocultos).
2. Integração harmoniosa entre cliente Canvas, Firestore Zero-Trust ABAC, Google Auth e Model Garden MaaS.
3. Preservação irrevogável da autoria, governança patrimonial e rastreabilidade temporal UTC/GMT.

Pacto Operacional: "Eu crio, você distribui."
Autor Titular: pastana7773d@gmail.com · Pastana Dynamics`,
  },
];

export const CommunityAnnouncementDispatch: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = selectedCategory === 'all' 
    ? DISPATCH_LIST 
    : DISPATCH_LIST.filter(d => d.categoria.toLowerCase().includes(selectedCategory.toLowerCase()));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-sky-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
              <Share2 className="w-4 h-4" />
              <span>Central de Despacho & Transmissão aos Desenvolvedores</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Anúncios e Respostas Oficiais para os Fóruns Google
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Mensagens técnicas formatadas com evidências, diagnóstico exato e links da solução para publicação direta nos tópicos onde os desenvolvedores estavam travados.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" /> 5 Respostas Prontas
            </span>
          </div>
        </div>
      </div>

      {/* Dispatch Cards Grid */}
      <div className="space-y-6">
        {filtered.map((dispatch) => (
          <div
            key={dispatch.id}
            className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wider block">
                  {dispatch.canal}
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Para: <span className="text-sky-300">{dispatch.destinatario}</span>
                </h3>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Ref: <span className="italic">{dispatch.topicoOriginal}</span>
                </span>
              </div>

              <button
                onClick={() => handleCopy(dispatch.conteudo, dispatch.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors shrink-0"
              >
                {copiedId === dispatch.id ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === dispatch.id ? 'Copiado para Envio!' : 'Copiar Resposta Formatada'}</span>
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-300">Assunto: {dispatch.assunto}</span>
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {dispatch.conteudo}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
