export type SourceType =
  | 'HARDWARE_ROOT'
  | 'AUDITED_DATABASE'
  | 'ENTERPRISE_API'
  | 'INTERNAL_REASONING'
  | 'AUTHENTICATED_EMAIL'
  | 'WEB_SCRAPE'
  | 'ANONYMOUS_WEBHOOK';

export type MemoryStatus = 'TRUSTED' | 'QUARANTINED' | 'POISONED';

export type NodeType =
  | 'raw_source'
  | 'derived_fact'
  | 'agent_inference'
  | 'agent_plan'
  | 'action_intent';

export interface MemoryMetadata {
  source: string;
  sourceType: SourceType;
  sourceReliability: number; // 0.0 to 1.0
  corroborationCount: number; // number of independent agreeing sources
  createdAt: number; // timestamp ms
  lastVerifiedAt: number; // timestamp ms
  tags: string[];
  entitySubject?: string;
}

export interface MemoryItem {
  id: string;
  content: string;
  metadata: MemoryMetadata;
  parentIds: string[];
  childrenIds: string[];
  
  // Mathematical trust components
  rawTrustScore: number; // Reliability * Corroboration * Decay * Consistency
  effectiveTrust: number; // After Anti-Laundering inheritance min(parents)
  decayFactor: number;
  consistencyScore: number;
  
  status: MemoryStatus;
  isTainted: boolean;
  taintReason?: string;
  
  // Cryptographic Ledger details
  ledgerIndex: number;
  blockHash: string;
  previousHash: string;
}

export interface LedgerBlock {
  index: number;
  timestamp: number;
  memoryId: string;
  payloadHash: string;
  previousHash: string;
  currentHash: string;
  payloadSummary: string;
  isTampered?: boolean;
}

export interface ProvenanceNode {
  id: string;
  label: string;
  type: NodeType;
  content: string;
  trustScore: number;
  status: MemoryStatus;
  isTainted: boolean;
  parents: string[];
  children: string[];
  x?: number;
  y?: number;
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ToolPolicy {
  toolName: string;
  riskLevel: RiskLevel;
  minTrustRequired: number;
  requiresHumanReview: boolean;
  description: string;
}

export interface ActionInvocation {
  id: string;
  toolName: string;
  parameters: Record<string, any>;
  originatingMemoryId: string;
  planMemoryId: string;
  timestamp: number;
  status: 'PENDING_EVALUATION' | 'APPROVED' | 'BLOCKED' | 'PENDING_HUMAN_APPROVAL';
  riskLevel: RiskLevel;
  blockReason?: string;
  evaluatedTrust: number;
  taintedAncestors: string[];
}

export interface BlastRadiusReport {
  rootCompromisedId: string;
  taintedNodeIds: string[];
  purgedDerivedFacts: string[];
  purgedPlans: string[];
  blockedActions: string[];
  ledgerTombstonesCreated: number;
  timestamp: number;
}

export interface LedgerAuditResult {
  isValid: boolean;
  totalBlocks: number;
  brokenBlockIndex: number | null;
  expectedHash: string | null;
  actualHash: string | null;
  chainHead: string;
}
