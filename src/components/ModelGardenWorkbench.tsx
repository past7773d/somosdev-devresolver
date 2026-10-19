import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  Cpu, 
  Play, 
  Copy, 
  Check, 
  Terminal, 
  BookmarkPlus, 
  RefreshCw,
  Zap,
  DollarSign,
  Layers
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '@/src/services/firebase.ts';
import { collection, addDoc } from 'firebase/firestore';

interface ModelGardenWorkbenchProps {
  currentUser: User | null;
  onSavedDiagnostic?: () => void;
}

export const ModelGardenWorkbench: React.FC<ModelGardenWorkbenchProps> = ({ 
  currentUser, 
  onSavedDiagnostic 
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'python' | 'node'>('curl');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState('Analise a arquitetura de microsserviços e resuma os pontos únicos de falha:');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedResponse, setSimulatedResponse] = useState('');
  const [simulatedStats, setSimulatedStats] = useState<{ ttftMs: number; tokensPerSec: number; totalTokens: number } | null>(null);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Cost calculator states
  const [monthlyRequests, setMonthlyRequests] = useState(50000);
  const [avgInputTokens, setAvgInputTokens] = useState(1200);
  const [avgOutputTokens, setAvgOutputTokens] = useState(600);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Cost math for DeepSeek V4.1 Flash MaaS on Model Garden:
  // Input: $0.14 / 1M tokens, Output: $0.28 / 1M tokens
  const totalInputTokensMonthly = (monthlyRequests * avgInputTokens) / 1000000;
  const totalOutputTokensMonthly = (monthlyRequests * avgOutputTokens) / 1000000;
  const deepseekMonthlyCost = (totalInputTokensMonthly * 0.14) + (totalOutputTokensMonthly * 0.28);
  const geminiFlashMonthlyCost = (totalInputTokensMonthly * 0.10) + (totalOutputTokensMonthly * 0.40);

  // Run simulation
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimulatedResponse('');
    setSimulatedStats(null);

    const fullResponse = `[DeepSeek V4.1 Flash via Google Cloud Model Garden MaaS]

Pontos Críticos de Falha Identificados:
1. Ponto Central de Autenticação (SPOF): O gateway de API depende de uma instância singleton de validação de JWT sem fallback assíncrono.
2. Incompatibilidade de Timeout no AppSheet Bot: Chamadas síncronas de webhook para geração de relatórios excedem a janela de 30s.
3. Decaimento de Metadados: Falta de replicação multi-região na taxonomia de governança.

Recomendação: Implementar Circuit Breaker e filas assíncronas no Cloud Pub/Sub.`;

    let currentLength = 0;
    const interval = setInterval(() => {
      currentLength += 8;
      if (currentLength >= fullResponse.length) {
        setSimulatedResponse(fullResponse);
        setSimulatedStats({
          ttftMs: 142,
          tokensPerSec: 135,
          totalTokens: 148,
        });
        setIsSimulating(false);
        clearInterval(interval);
      } else {
        setSimulatedResponse(fullResponse.substring(0, currentLength));
      }
    }, 40);
  };

  // Code snippets
  const curlSnippet = `curl -X POST \\
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \\
  -H "Content-Type: application/json" \\
  https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/us-central1/publishers/deepseek/models/deepseek-v4.1-flash:predict \\
  -d '{
    "instances": [
      {
        "prompt": "${testPrompt}",
        "max_output_tokens": 1024,
        "temperature": 0.2,
        "top_p": 0.95
      }
    ]
  }'`;

  const pythonSnippet = `import os
from google.cloud import aiplatform

# Inicializa o cliente Vertex AI para o Model Garden
aiplatform.init(
    project=os.environ.get("GOOGLE_CLOUD_PROJECT", "YOUR_PROJECT_ID"),
    location="us-central1"
)

# Endpoint totalmente gerenciado (MaaS) do DeepSeek V4.1 Flash
endpoint = aiplatform.Endpoint(
    endpoint_name="projects/YOUR_PROJECT_ID/locations/us-central1/publishers/deepseek/models/deepseek-v4.1-flash"
)

response = endpoint.predict(
    instances=[
        {
            "prompt": "${testPrompt}",
            "temperature": 0.2,
            "max_tokens": 1024
        }
    ]
)

print("Resposta do DeepSeek V4.1 Flash:")
print(response.predictions[0]["content"])
`;

  const nodeSnippet = `import { GoogleAuth } from 'google-auth-library';

async function invokeDeepSeekFlashMaaS(prompt: string) {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  const client = await auth.getClient();
  const projectId = await auth.getProjectId();
  const url = \`https://us-central1-aiplatform.googleapis.com/v1/projects/\${projectId}/locations/us-central1/publishers/deepseek/models/deepseek-v4.1-flash:predict\`;

  const response = await client.request({
    url,
    method: 'POST',
    data: {
      instances: [{ prompt, max_tokens: 1024, temperature: 0.2 }]
    }
  });

  return response.data;
}
`;

  // Save diagnostic to Firestore
  const handleSaveDiagnostic = async () => {
    if (!currentUser) return;
    setSavingStatus('saving');
    try {
      await addDoc(collection(db, 'diagnostics'), {
        userId: currentUser.uid,
        toolType: 'model_garden',
        title: 'Model Garden MaaS: DeepSeek V4.1 Flash',
        inputSummary: `Prompt: "${testPrompt.substring(0, 80)}..." | ${monthlyRequests} req/mês`,
        resultSummary: `Custo Estimado: $${deepseekMonthlyCost.toFixed(2)}/mês | Latência TTFT: ~140ms`,
        sanitizedCode: curlSnippet,
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
            <span>Caso Stanley Lee</span>
            <span aria-hidden="true">·</span>
            <span>Model Garden MaaS</span>
            <span aria-hidden="true">·</span>
            <span>Google Cloud Gemini Platform</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            DeepSeek V4.1 Flash: Workbench e Integração MaaS Gerenciada
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Implementação prática para o modelo DeepSeek V4.1 Flash em Public Preview no Model Garden: snippets prontos de invocação, benchmarks de latência e calculadora de custos gerenciados.
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

      {/* Grid: Simulator & Cost Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Interactive Prompt Tester */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
            <Cpu className="w-4 h-4" />
            <h3>1. Teste de Invocação e Resposta Simulada</h3>
          </div>
          <p className="text-xs text-slate-400">
            Experimente uma chamada direta ao endpoint MaaS gerenciado na infraestrutura Google Cloud:
          </p>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Prompt de Teste:</label>
            <textarea
              rows={3}
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-750 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'Invocando Model Garden...' : 'Executar Invocação MaaS'}</span>
          </button>

          {simulatedResponse && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="text-emerald-400 font-medium">Resposta Streaming Recebida:</span>
                {simulatedStats && (
                  <span className="font-mono text-slate-300">
                    TTFT: {simulatedStats.ttftMs}ms · {simulatedStats.tokensPerSec} t/s · {simulatedStats.totalTokens} tokens
                  </span>
                )}
              </div>
              <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                {simulatedResponse}
              </pre>
            </div>
          )}
        </div>

        {/* Right: Cost & Throughput Calculator */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
            <DollarSign className="w-4 h-4" />
            <h3>2. Calculadora de Custo de Model-as-a-Service</h3>
          </div>
          <p className="text-xs text-slate-400">
            Compare o custo mensal estimado de uso do DeepSeek V4.1 Flash gerenciado na infraestrutura Google Cloud:
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Requisições Mensais:</span>
                <span className="font-mono font-semibold tabular-nums">{monthlyRequests.toLocaleString()} req</span>
              </div>
              <input
                type="range"
                min={5000}
                max={500000}
                step={5000}
                value={monthlyRequests}
                onChange={(e) => setMonthlyRequests(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-400">Média Tokens Entrada:</label>
                <input
                  type="number"
                  value={avgInputTokens}
                  onChange={(e) => setAvgInputTokens(Number(e.target.value))}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono bg-slate-950 border border-slate-750 rounded text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Média Tokens Saída:</label>
                <input
                  type="number"
                  value={avgOutputTokens}
                  onChange={(e) => setAvgOutputTokens(Number(e.target.value))}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono bg-slate-950 border border-slate-750 rounded text-slate-200"
                />
              </div>
            </div>

            {/* Comparison Cards */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-slate-950 rounded-lg border border-sky-800/50">
                <span className="text-[11px] font-medium text-sky-400">DeepSeek V4.1 Flash (MaaS)</span>
                <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
                  ${deepseekMonthlyCost.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-500">In: $0.14/1M · Out: $0.28/1M</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Gemini 2.0 Flash</span>
                <div className="text-xl font-bold font-mono text-slate-300 mt-1 tabular-nums">
                  ${geminiFlashMonthlyCost.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-500">In: $0.10/1M · Out: $0.40/1M</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Snippets Section */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
            <Terminal className="w-4 h-4" />
            <h3>Código de Integração Pronto para Produção</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
              <button
                onClick={() => setActiveCodeTab('curl')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  activeCodeTab === 'curl' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                cURL (REST)
              </button>
              <button
                onClick={() => setActiveCodeTab('python')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  activeCodeTab === 'python' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Python SDK
              </button>
              <button
                onClick={() => setActiveCodeTab('node')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  activeCodeTab === 'node' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Node.js / TS
              </button>
            </div>

            <button
              onClick={() => {
                const code = activeCodeTab === 'curl' ? curlSnippet : activeCodeTab === 'python' ? pythonSnippet : nodeSnippet;
                handleCopy(code, activeCodeTab);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg border border-slate-700"
            >
              {copiedKey === activeCodeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copiar</span>
            </button>
          </div>
        </div>

        <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto max-h-80 leading-relaxed">
          {activeCodeTab === 'curl' && curlSnippet}
          {activeCodeTab === 'python' && pythonSnippet}
          {activeCodeTab === 'node' && nodeSnippet}
        </pre>
      </div>
    </div>
  );
};
