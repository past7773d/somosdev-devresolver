import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  X, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  Database, 
  Cpu, 
  History, 
  RefreshCw 
} from 'lucide-react';
import { DiagnosticRecord } from '@/src/types/index.ts';
import { db, handleFirestoreError, OperationType } from '@/src/services/firebase.ts';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';

interface SavedDiagnosticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSelectRecord?: (record: DiagnosticRecord) => void;
}

export const SavedDiagnosticsDrawer: React.FC<SavedDiagnosticsDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [records, setRecords] = useState<DiagnosticRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !isOpen) {
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'diagnostics'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: DiagnosticRecord[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as DiagnosticRecord[];
        setRecords(loaded);
        setLoading(false);
      },
      (error) => {
        console.warn('Diagnostics error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isOpen]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'diagnostics', id));
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `diagnostics/${id}`);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col p-6 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <History className="w-4 h-4 text-sky-400" />
            <span>Diagnósticos Salvos</span>
            <span className="text-xs font-mono text-slate-400">({records.length})</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
              <span className="text-xs">Carregando histórico do Firestore...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-xs text-slate-400">Nenhum diagnóstico salvo ainda.</p>
              <p className="text-[11px] text-slate-500">
                Use o botão "Salvar no Meu Histórico" em qualquer uma das ferramentas para guardar seus templates.
              </p>
            </div>
          ) : (
            records.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    {rec.toolType === 'appsheet_pdf' && <FileText className="w-3.5 h-3.5 text-sky-400" />}
                    {rec.toolType === 'dataplex_catalog' && <Database className="w-3.5 h-3.5 text-emerald-400" />}
                    {rec.toolType === 'model_garden' && <Cpu className="w-3.5 h-3.5 text-purple-400" />}
                    <span>{rec.title}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(rec.id)}
                    title="Excluir diagnóstico"
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1">
                  <div><strong>Entrada:</strong> {rec.inputSummary}</div>
                  <div><strong>Resultado:</strong> {rec.resultSummary}</div>
                  <div className="text-slate-500 font-mono text-[10px]">
                    {new Date(rec.createdAt).toLocaleString('pt-BR')}
                  </div>
                </div>

                {rec.sanitizedCode && (
                  <div className="pt-2 border-t border-slate-850 flex justify-end">
                    <button
                      onClick={() => handleCopyCode(rec.sanitizedCode, rec.id)}
                      className="flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white"
                    >
                      {copiedId === rec.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === rec.id ? 'Copiado' : 'Copiar Código'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
