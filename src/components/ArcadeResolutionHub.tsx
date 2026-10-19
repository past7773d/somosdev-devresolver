import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  Award, 
  ThumbsUp, 
  Plus, 
  Printer, 
  HardDrive, 
  BatteryCharging, 
  FileCheck, 
  Download, 
  Check, 
  Copy,
  Clock,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react';
import { ArcadeProposal } from '@/src/types/index.ts';
import { db, handleFirestoreError, OperationType } from '@/src/services/firebase.ts';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  addDoc, 
  getDocs,
  where 
} from 'firebase/firestore';

interface ArcadeResolutionHubProps {
  currentUser: User | null;
}

const DEFAULT_PROPOSALS: ArcadeProposal[] = [
  {
    id: 'prop-printer-rehaan',
    userId: 'community-rehaan',
    authorName: 'Rehaan Kaushar',
    title: 'Mini Impressora Térmica para Níveis Champion e Legend',
    targetTier: 'Champion',
    description: 'Adicionar uma mini impressora térmica sem tinta como opção de recompensa. Extremamente útil para estudantes imprimirem notas de estudo, resumos de arquitetura GCP e checklists de laboratório.',
    estimatedEffortPoints: 85,
    voteCount: 142,
    status: 'proposed',
    createdAt: '2026-10-16T12:00:00Z',
  },
  {
    id: 'prop-ssd-avishek',
    userId: 'community-avishek',
    authorName: 'Avishek Dutta',
    title: 'Kit Dev Prático: SSD Portátil 1TB NVMe ou Power Bank 65W PD',
    targetTier: 'Legend',
    description: 'Para quem dedicou mais de 120 pontos ao longo de um ano inteiro de labs e trilhas, o brinde deve refletir valor técnico tangível em vez de itens decorativos que já temos.',
    estimatedEffortPoints: 120,
    voteCount: 218,
    status: 'under_review',
    createdAt: '2026-10-12T14:30:00Z',
  },
  {
    id: 'prop-voucher-certs',
    userId: 'community-certs',
    authorName: 'Comunidade Global Devs',
    title: 'Voucher de 100% para Exame de Certificação Google Cloud (ACE/PCA)',
    targetTier: 'Legend',
    description: 'Permitir a troca de 120+ pontos do Arcade por 1 voucher oficial de certificação Associate Cloud Engineer ou Professional Cloud Architect.',
    estimatedEffortPoints: 120,
    voteCount: 384,
    status: 'validated',
    createdAt: '2026-10-10T09:00:00Z',
  },
];

export const ArcadeResolutionHub: React.FC<ArcadeResolutionHubProps> = ({ currentUser }) => {
  // Effort Calculator
  const [points, setPoints] = useState(120);
  const [skillBadges, setSkillBadges] = useState(18);
  const [hoursSpent, setHoursSpent] = useState(140);

  // Proposals & Votes
  const [proposals, setProposals] = useState<ArcadeProposal[]>(DEFAULT_PROPOSALS);
  const [userVotedIds, setUserVotedIds] = useState<string[]>([]);
  const [tierFilter, setTierFilter] = useState<'All' | 'Champion' | 'Legend'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedManifesto, setCopiedManifesto] = useState(false);

  // New proposal form
  const [newTitle, setNewTitle] = useState('');
  const [newTier, setNewTier] = useState<'Champion' | 'Legend' | 'All'>('Champion');
  const [newDesc, setNewDesc] = useState('');
  const [newPoints, setNewPoints] = useState(90);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate effort parity
  const computeEffort = Math.round(hoursSpent * 4.5); // equivalent lab hours in cloud credit value
  const estimatedCertificateReadiness = Math.min(100, Math.round((points / 120) * 100));

  // Sync proposals from Firestore (if available) or fallback to defaults
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    try {
      const q = query(collection(db, 'arcade_proposals'));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const loaded = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            })) as ArcadeProposal[];
            setProposals(loaded);
          } else {
            setProposals(DEFAULT_PROPOSALS);
          }
        },
        (error) => {
          console.warn('Using local proposals fallback:', error);
          setProposals(DEFAULT_PROPOSALS);
        }
      );
    } catch (err) {
      console.warn('Firestore subscription not available:', err);
    }
    return () => unsubscribe();
  }, []);

  // Sync user's cast votes
  useEffect(() => {
    if (!currentUser) {
      setUserVotedIds([]);
      return;
    }
    let unsubscribeVotes: () => void = () => {};
    try {
      const q = query(collection(db, 'arcade_votes'), where('userId', '==', currentUser.uid));
      unsubscribeVotes = onSnapshot(
        q,
        (snapshot) => {
          const voted = snapshot.docs.map((d) => d.data().proposalId as string);
          setUserVotedIds(voted);
        },
        (error) => {
          console.warn('Error reading votes:', error);
        }
      );
    } catch (err) {
      console.warn('Vote listener setup failed:', err);
    }
    return () => unsubscribeVotes();
  }, [currentUser]);

  // Handle Vote / Upvote
  const handleToggleVote = async (proposal: ArcadeProposal) => {
    if (!currentUser) {
      alert('Faça login com sua conta Google para votar e apoiar propostas da comunidade.');
      return;
    }

    const hasVoted = userVotedIds.includes(proposal.id);
    const voteDocId = `${currentUser.uid}_${proposal.id}`;

    // Optimistic UI update
    if (hasVoted) {
      setUserVotedIds((prev) => prev.filter((id) => id !== proposal.id));
      setProposals((prev) =>
        prev.map((p) => (p.id === proposal.id ? { ...p, voteCount: Math.max(0, p.voteCount - 1) } : p))
      );
    } else {
      setUserVotedIds((prev) => [...prev, proposal.id]);
      setProposals((prev) =>
        prev.map((p) => (p.id === proposal.id ? { ...p, voteCount: p.voteCount + 1 } : p))
      );
    }

    try {
      if (hasVoted) {
        await deleteDoc(doc(db, 'arcade_votes', voteDocId));
        await updateDoc(doc(db, 'arcade_proposals', proposal.id), {
          voteCount: Math.max(0, proposal.voteCount - 1),
        });
      } else {
        await setDoc(doc(db, 'arcade_votes', voteDocId), {
          id: voteDocId,
          proposalId: proposal.id,
          userId: currentUser.uid,
          createdAt: new Date().toISOString(),
        });
        await updateDoc(doc(db, 'arcade_proposals', proposal.id), {
          voteCount: proposal.voteCount + 1,
        });
      }
    } catch (err) {
      console.warn('Firestore vote sync handled locally:', err);
    }
  };

  // Submit new proposal
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);

    const newProp: Omit<ArcadeProposal, 'id'> = {
      userId: currentUser.uid,
      authorName: currentUser.displayName || 'Dev da Comunidade',
      title: newTitle,
      targetTier: newTier,
      description: newDesc,
      estimatedEffortPoints: newPoints,
      voteCount: 0,
      status: 'proposed',
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(db, 'arcade_proposals'), newProp);
      setProposals((prev) => [{ id: docRef.id, ...newProp }, ...prev]);
      setIsModalOpen(false);
      setNewTitle('');
      setNewDesc('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'arcade_proposals');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manifesto text for export
  const manifestoText = `# Manifesto de Resolução da Comunidade Google Arcade
Data: ${new Date().toLocaleDateString('pt-BR')}
Autores: Desenvolvedores da Comunidade Google Cloud & Arcade

## 1. Contexto e Reivindicação
Centenas de desenvolvedores dedicam anualmente centenas de horas completando laboratórios no Google Cloud Skills Boost, alcançando mais de 120 pontos nos níveis Champion e Legend. A entrega de itens promocionais repetitivos (como garrafas plásticas e cabos comuns) não reflete o valor gerado e a dedicação ao ecossistema Google Cloud.

## 2. Recompensas Práticas Propostas com Amplo Apoio Comunitário:
${proposals
  .map(
    (p, i) => `${i + 1}. [${p.targetTier}] ${p.title} (${p.voteCount} votos)
   Autor: ${p.authorName} | Pontos Sugeridos: ${p.estimatedEffortPoints} pts
   Justificativa: ${p.description}
`
  )
  .join('\n')}

## 3. Conclusão
Solicitamos à equipe do Google Developer Relations e Arcade Community a inclusão de opções de equipamentos práticos (mini impressoras para resumos, SSDs, power banks de alta potência) e vouchers oficiais de exames de certificação.`;

  const handleCopyManifesto = () => {
    navigator.clipboard.writeText(manifestoText);
    setCopiedManifesto(true);
    setTimeout(() => setCopiedManifesto(false), 2000);
  };

  const filteredProposals = proposals.filter((p) => {
    if (tierFilter === 'All') return true;
    return p.targetTier === tierFilter || p.targetTier === 'All';
  });

  return (
    <div className="space-y-8">
      {/* Context Header */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Voz da Comunidade</span>
            <span aria-hidden="true">·</span>
            <span>Google Cloud Arcade</span>
            <span aria-hidden="true">·</span>
            <span>Avishek, Rehaan, Roshan2, 100</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Central de Resolução & Recompensas Justas do Google Arcade
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Calculadora de esforço real vs. utilidade, manifesto formal da comunidade e painel de votação para inclusão de mini impressoras térmicas, SSDs, power banks e vouchers de certificação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyManifesto}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shrink-0"
          >
            {copiedManifesto ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedManifesto ? 'Copiado!' : 'Copiar Manifesto'}</span>
          </button>
          {currentUser && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Propor Nova Recompensa</span>
            </button>
          )}
        </div>
      </div>

      {/* Effort Calculator Card */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
          <TrendingUp className="w-4 h-4" />
          <h3>1. Calculadora de Paridade de Esforço & Valor de Habilidades</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Pontos do Arcade Acumulados:</span>
              <span className="font-mono font-bold text-sky-400 tabular-nums">{points} pts</span>
            </div>
            <input
              type="range"
              min={10}
              max={150}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <span className="text-[11px] text-slate-500">Nível: {points >= 120 ? 'Legend (120+)' : points >= 80 ? 'Champion (80+)' : 'Standard'}</span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Skill Badges Conquistados:</span>
              <span className="font-mono font-bold text-sky-400 tabular-nums">{skillBadges} badges</span>
            </div>
            <input
              type="range"
              min={1}
              max={40}
              value={skillBadges}
              onChange={(e) => setSkillBadges(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <span className="text-[11px] text-slate-500">Laboratórios avançados de Cloud Architecture</span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Horas de Estudo em Labs:</span>
              <span className="font-mono font-bold text-sky-400 tabular-nums">{hoursSpent} horas</span>
            </div>
            <input
              type="range"
              min={20}
              max={300}
              step={5}
              value={hoursSpent}
              onChange={(e) => setHoursSpent(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <span className="text-[11px] text-slate-500">Tempo de teclado e resolução de desafios</span>
          </div>
        </div>

        {/* Calculated Result KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400">Valor de Créditos / Compute Equivalent</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
              R$ {computeEffort * 5},00
            </div>
            <span className="text-[10px] text-slate-500">Custo equivalente em infraestrutura de labs</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400">Prontidão para Certificação Oficial</span>
            <div className="text-xl font-bold font-mono text-sky-400 mt-1 tabular-nums">
              {estimatedCertificateReadiness}%
            </div>
            <span className="text-[10px] text-slate-500">Base técnica para exame ACE / PCA</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400">Categoria Justa de Recompensa</span>
            <div className="text-xl font-bold font-mono text-amber-300 mt-1">
              {points >= 120 ? 'SSD / Voucher Cert' : points >= 80 ? 'Impressora Térmica' : 'Kit Tech'}
            </div>
            <span className="text-[10px] text-slate-500">Baseada no esforço comprovado</span>
          </div>
        </div>
      </div>

      {/* Proposals Voting Feed */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
            <Award className="w-4 h-4" />
            <h3>2. Propostas Oficiais da Comunidade para o Google Dev Team</h3>
          </div>

          {/* Segmented Filter */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setTierFilter('All')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                tierFilter === 'All' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos os Níveis
            </button>
            <button
              onClick={() => setTierFilter('Champion')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                tierFilter === 'Champion' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Nível Champion
            </button>
            <button
              onClick={() => setTierFilter('Legend')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                tierFilter === 'Legend' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Nível Legend (120+)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProposals.map((proposal) => {
            const hasVoted = userVotedIds.includes(proposal.id);
            return (
              <div
                key={proposal.id}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-medium text-sky-400">{proposal.targetTier} Tier</span>
                    <span className="font-mono">{proposal.estimatedEffortPoints} pts sugeridos</span>
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {proposal.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {proposal.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Por <span className="text-slate-300 font-medium">{proposal.authorName}</span>
                  </div>

                  <button
                    onClick={() => handleToggleVote(proposal)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      hasVoted
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-sky-400 text-sky-400' : ''}`} />
                    <span className="font-mono tabular-nums">{proposal.voteCount}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: New Proposal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Propor Recompensa Prática</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProposal} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300">Título da Recompensa / Solução:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Teclado Mecânico Compacto para Labs"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-950 border border-slate-750 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-300">Nível do Arcade:</label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-950 border border-slate-750 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Champion">Champion (80+ pts)</option>
                    <option value="Legend">Legend (120+ pts)</option>
                    <option value="All">Todos os Níveis</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Pontos Estimados:</label>
                  <input
                    type="number"
                    value={newPoints}
                    onChange={(e) => setNewPoints(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-750 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Justificativa e Utilidade para Desenvolvedores:</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explique por que esta recompensa recompensa adequadamente o tempo e dedicação de estudo dos desenvolvedores..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-950 border border-slate-750 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Enviando...' : 'Publicar Proposta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
