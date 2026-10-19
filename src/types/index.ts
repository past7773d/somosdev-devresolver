export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: string;
}

export interface DiagnosticRecord {
  id: string;
  userId: string;
  toolType: 'appsheet_pdf' | 'dataplex_catalog' | 'model_garden';
  title: string;
  inputSummary: string;
  resultSummary: string;
  sanitizedCode: string;
  createdAt: string;
}

export interface ArcadeProposal {
  id: string;
  userId: string;
  authorName: string;
  title: string;
  targetTier: 'Champion' | 'Legend' | 'All';
  description: string;
  estimatedEffortPoints: number;
  voteCount: number;
  status: 'proposed' | 'under_review' | 'validated';
  createdAt: string;
}

export interface ArcadeVote {
  id: string;
  proposalId: string;
  userId: string;
  createdAt: string;
}
