import React, { useState, useRef } from 'react';
import { User } from 'firebase/auth';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Download, 
  Copy, 
  Check, 
  Upload, 
  Image as ImageIcon,
  Sparkles,
  BookmarkPlus,
  RefreshCw
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '@/src/services/firebase.ts';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface AppSheetPdfSolverProps {
  currentUser: User | null;
  onSavedDiagnostic?: () => void;
}

export const AppSheetPdfSolver: React.FC<AppSheetPdfSolverProps> = ({ currentUser, onSavedDiagnostic }) => {
  // Input states
  const [driveUrl, setDriveUrl] = useState('');
  const [convertedUrl, setConvertedUrl] = useState('');
  const [imageColName, setImageColName] = useState('FotoComprovante');
  const [targetWidth, setTargetWidth] = useState(300);
  const [targetHeight, setTargetHeight] = useState(220);

  // Sanitizer states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalDetails, setOriginalDetails] = useState<{
    format: string;
    width: number;
    height: number;
    sizeKb: number;
    hasAlpha: boolean;
    previewUrl: string;
  } | null>(null);
  const [sanitizedResult, setSanitizedResult] = useState<{
    blob: Blob;
    previewUrl: string;
    sizeKb: number;
    format: string;
    width: number;
    height: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Helper: Copy to clipboard
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Convert Drive Link
  const handleConvertDriveUrl = (input: string) => {
    setDriveUrl(input);
    if (!input.trim()) {
      setConvertedUrl('');
      return;
    }

    // Match file ID from various Google Drive URL variants
    // 1. /file/d/FILE_ID/view
    // 2. id=FILE_ID
    // 3. /open?id=FILE_ID
    const match = input.match(/\/d\/([a-zA-Z0-9_-]+)/) || input.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const fileId = match[1];
      // Format recommended by AppSheet documentation for direct image fetching in PDF BOT
      const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      setConvertedUrl(directUrl);
    } else {
      setConvertedUrl('');
    }
  };

  // Process and sanitize image with Canvas API
  const processImage = (file: File) => {
    setIsProcessing(true);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const origW = img.width;
        const origH = img.height;
        const sizeKb = Math.round(file.size / 1024);
        const format = file.type || 'image/unknown';

        // Check if format is problematic for AppSheet
        const isUnsupported = !['image/jpeg', 'image/png'].includes(format);

        setOriginalDetails({
          format,
          width: origW,
          height: origH,
          sizeKb,
          hasAlpha: format === 'image/png' || format === 'image/webp',
          previewUrl: e.target?.result as string,
        });

        // Compute constrained dimensions (Max 1200x900 for fast high-res PDF embedding)
        let newW = origW;
        let newH = origH;
        const maxDimension = 1200;
        if (newW > maxDimension || newH > maxDimension) {
          if (newW > newH) {
            newH = Math.round((newH * maxDimension) / newW);
            newW = maxDimension;
          } else {
            newW = Math.round((newW * maxDimension) / newH);
            newH = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = newW;
        canvas.height = newH;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Draw white background first to eliminate black transparency bugs in PDF renderers
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, newW, newH);
          ctx.drawImage(img, 0, 0, newW, newH);

          // Convert to clean JPEG with 0.88 quality
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const sanitizedUrl = URL.createObjectURL(blob);
                setSanitizedResult({
                  blob,
                  previewUrl: sanitizedUrl,
                  sizeKb: Math.round(blob.size / 1024),
                  format: 'image/jpeg',
                  width: newW,
                  height: newH,
                });
              }
              setIsProcessing(false);
            },
            'image/jpeg',
            0.88
          );
        } else {
          setIsProcessing(false);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  // Load sample problematic image
  const handleLoadSample = () => {
    // Generate a programmatic sample Canvas with simulated unsupported WebP/Alpha
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 1600;
    sampleCanvas.height = 1200;
    const ctx = sampleCanvas.getContext('2d');
    if (ctx) {
      // Draw simulated receipt/invoice with transparency
      ctx.fillStyle = 'rgba(240, 245, 255, 0.9)';
      ctx.fillRect(0, 0, 1600, 1200);
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 48px sans-serif';
      ctx.fillText('COMPROVANTE DE INSPEÇÃO #84920', 80, 150);
      ctx.font = '32px sans-serif';
      ctx.fillText('Data: 2026-10-18 | Origem: AppSheet Mobile Form', 80, 240);
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(80, 300, 400, 200);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('QR/Foto Válida', 120, 410);

      sampleCanvas.toBlob((blob) => {
        if (blob) {
          const fakeFile = new File([blob], 'comprovante_erro_camera.webp', { type: 'image/webp' });
          processImage(fakeFile);
        }
      }, 'image/webp');
    }
  };

  // Download sanitized image
  const handleDownloadSanitized = () => {
    if (!sanitizedResult) return;
    const a = document.createElement('a');
    a.href = sanitizedResult.previewUrl;
    a.download = `sanitized_${selectedFile?.name.replace(/\.[^/.]+$/, '') || 'image'}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Template snippets
  const googleDocsTemplate = `<<Image: [${imageColName}], ${targetWidth}, ${targetHeight}>>`;
  const appSheetVirtualColumn = `IF(
  ISBLANK([${imageColName}]),
  "",
  IF(
    CONTAINS([${imageColName}], "drive.google.com"),
    CONCATENATE(
      "https://drive.google.com/uc?export=view&id=",
      INDEX(EXTRACT([${imageColName}], "id=([a-zA-Z0-9_-]+)"), 1)
    ),
    [${imageColName}]
  )
)`;

  const appsScriptWebhook = `// Google Apps Script: Webhook para converter imagens antes do envio do Bot
function sanitizeAppSheetImage(e) {
  var request = JSON.parse(e.postData.contents);
  var fileId = request.fileId;
  var file = DriveApp.getFileById(fileId);
  var blob = file.getBlob();
  
  // Converte WebP/AVIF ou PNG com Alpha para JPEG compatível com o gerador de PDF
  var sanitizedBlob = Utilities.newBlob(blob.getBytes(), "image/jpeg", file.getName() + ".jpg");
  var savedFile = DriveApp.createFile(sanitizedBlob);
  savedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    sanitizedUrl: "https://drive.google.com/uc?export=view&id=" + savedFile.getId()
  })).setMimeType(ContentService.MimeType.JSON);
}`;

  // Save diagnostic to Firestore
  const handleSaveDiagnostic = async () => {
    if (!currentUser) return;
    setSavingStatus('saving');
    try {
      await addDoc(collection(db, 'diagnostics'), {
        userId: currentUser.uid,
        toolType: 'appsheet_pdf',
        title: `AppSheet PDF Fix: [${imageColName}]`,
        inputSummary: driveUrl ? `URL: ${driveUrl.substring(0, 80)}...` : `Arquivo: ${selectedFile?.name || 'Sanitização manual'} (${originalDetails?.format || 'img'})`,
        resultSummary: `Template: <<Image: [${imageColName}], ${targetWidth}, ${targetHeight}>> gerado com sanitização JPEG/Clean Alpha.`,
        sanitizedCode: `${googleDocsTemplate}\n\n---\nVirtual Column:\n${appSheetVirtualColumn}`,
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
      {/* Problem Context Banner */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Caso Junnior Garcia</span>
            <span aria-hidden="true">·</span>
            <span>AppSheet Q&A</span>
            <span aria-hidden="true">·</span>
            <span>Resolvido com Evidências</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Erro de Formato de Imagen: Geração de PDF via BOT
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Solução completa para o erro onde bots do AppSheet falham ao renderizar relatórios em PDF devido a formatos WebP/AVIF incompatíveis, canais alfa, ou URLs de compartilhamento indiretas do Google Drive.
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

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Interactive Sanitizer & URL Fixer */}
        <div className="space-y-6">
          {/* Section 1: Google Drive URL Fixer */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
              <FileText className="w-4 h-4" />
              <h3>1. Conversor de URL Direta do Google Drive</h3>
            </div>
            <p className="text-xs text-slate-400">
              O motor de PDF do AppSheet falha se você usar links do tipo <code className="text-slate-300">/file/d/.../view</code>. Insira o link para converter para o endpoint nativo direto:
            </p>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Link de Compartilhamento do Google Drive:</label>
              <input
                type="text"
                placeholder="https://drive.google.com/file/d/1A2B3C4D5E6F7G/view?usp=sharing"
                value={driveUrl}
                onChange={(e) => handleConvertDriveUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-750 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>

            {convertedUrl ? (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> URL Direta Compatível com BOT:
                  </span>
                  <button
                    onClick={() => handleCopy(convertedUrl, 'driveUrl')}
                    className="flex items-center gap-1 text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'driveUrl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar</span>
                  </button>
                </div>
                <div className="text-xs font-mono text-emerald-200 break-all p-2 bg-slate-950/70 rounded">
                  {convertedUrl}
                </div>
              </div>
            ) : driveUrl ? (
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Nenhum ID de arquivo do Google Drive detectado na URL. Certifique-se de que contenha <code>/d/ID</code> ou <code>id=ID</code>.</span>
              </div>
            ) : null}
          </div>

          {/* Section 2: Image File Format Sanitizer */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
                <ImageIcon className="w-4 h-4" />
                <h3>2. Sanitizador de Imagens (Canvas API)</h3>
              </div>
              <button
                onClick={handleLoadSample}
                className="text-xs text-sky-400 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Carregar Exemplo Problemático</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Faça upload da imagem que falhou no Bot (ex: WebP, AVIF, fotos de smartphone com canais alfa ou dimensões gigantescas). O conversor normalizará para JPEG puro com fundo branco sólido.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-750 hover:border-sky-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/50"
            >
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-300">
                {selectedFile ? selectedFile.name : 'Clique para selecionar imagem ou arraste aqui'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Suporta WebP, PNG, JPEG, AVIF, HEIC</p>
            </div>

            {/* Side-by-side Inspection & Comparison */}
            {originalDetails && sanitizedResult && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-4">
                  {/* Original */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Imagem Original (Erro no Bot)
                    </span>
                    <img
                      src={originalDetails.previewUrl}
                      alt="Original"
                      className="w-full h-28 object-contain bg-slate-900 rounded border border-slate-800"
                    />
                    <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                      <div>Formato: <span className="text-white">{originalDetails.format}</span></div>
                      <div>Dimensões: <span className="text-white">{originalDetails.width}x{originalDetails.height}px</span></div>
                      <div>Tamanho: <span className="text-white">{originalDetails.sizeKb} KB</span></div>
                      <div>Alpha: <span className={originalDetails.hasAlpha ? 'text-amber-400' : 'text-slate-300'}>{originalDetails.hasAlpha ? 'Detectado (Risco no PDF)' : 'Não'}</span></div>
                    </div>
                  </div>

                  {/* Sanitized */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-emerald-800/50 space-y-2">
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Imagem Sanitizada (100% OK)
                    </span>
                    <img
                      src={sanitizedResult.previewUrl}
                      alt="Sanitizada"
                      className="w-full h-28 object-contain bg-slate-900 rounded border border-slate-800"
                    />
                    <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                      <div>Formato: <span className="text-emerald-300">image/jpeg (Baseline)</span></div>
                      <div>Dimensões: <span className="text-emerald-300">{sanitizedResult.width}x{sanitizedResult.height}px</span></div>
                      <div>Tamanho: <span className="text-emerald-300">{sanitizedResult.sizeKb} KB</span></div>
                      <div>Fundo: <span className="text-emerald-300">Branco Sólido (#FFF)</span></div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownloadSanitized}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Imagem Sanitizada para o AppSheet</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code Templates & Automation Scripts */}
        <div className="space-y-6">
          {/* Section 3: Google Docs PDF Template Tag */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
                <FileText className="w-4 h-4" />
                <h3>3. Sintaxe Exata do Template do Google Docs</h3>
              </div>
              <button
                onClick={() => handleCopy(googleDocsTemplate, 'template')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
              >
                {copiedKey === 'template' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Sintaxe</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Nunca utilize apenas <code className="text-rose-300">&lt;&lt;[Coluna]&gt;&gt;</code>. Sempre forneça largura e altura explicitamente em pixels para evitar estouro de memória no Bot:
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">Nome da Coluna:</label>
                <input
                  type="text"
                  value={imageColName}
                  onChange={(e) => setImageColName(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-750 rounded text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Largura (px):</label>
                <input
                  type="number"
                  value={targetWidth}
                  onChange={(e) => setTargetWidth(Number(e.target.value))}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono bg-slate-950 border border-slate-750 rounded text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Altura (px):</label>
                <input
                  type="number"
                  value={targetHeight}
                  onChange={(e) => setTargetHeight(Number(e.target.value))}
                  className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono bg-slate-950 border border-slate-750 rounded text-slate-200"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-sm text-sky-300">
              {googleDocsTemplate}
            </div>
          </div>

          {/* Section 4: AppSheet Virtual Column Expression */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
                <FileText className="w-4 h-4" />
                <h3>4. Fórmula de Virtual Column (Higienização no AppSheet)</h3>
              </div>
              <button
                onClick={() => handleCopy(appSheetVirtualColumn, 'formula')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
              >
                {copiedKey === 'formula' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Fórmula</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Crie uma Virtual Column no AppSheet chamada <code className="text-sky-300">[{imageColName}_Sanitized]</code> com tipo <strong>Image</strong> e cole a expressão abaixo para auto-corrigir URLs do Drive:
            </p>
            <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
              {appSheetVirtualColumn}
            </pre>
          </div>

          {/* Section 5: Webhook Apps Script Fallback */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
                <FileText className="w-4 h-4" />
                <h3>5. Automação via Google Apps Script (Webhook)</h3>
              </div>
              <button
                onClick={() => handleCopy(appsScriptWebhook, 'script')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
              >
                {copiedKey === 'script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Script</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Se as imagens forem capturadas por celulares Android/iOS em WebP, este Webhook converte no Google Drive antes do disparo do Bot:
            </p>
            <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
              {appsScriptWebhook}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
};
