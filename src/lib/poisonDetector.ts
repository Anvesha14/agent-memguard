import { MemoryItem } from './types';

export interface HeuristicScanResult {
  hasOvertInjection: boolean;
  patternsDetected: string[];
  severity: number;
}

export interface CovertScanResult {
  isCovertInjection: boolean;
  confidenceScore: number;
  threatType: string;
  reasoning: string;
  extractedDirectives: string[];
}

export interface ContradictionResult {
  isContradiction: boolean;
  conflictingMemoryId?: string;
  topicSimilarity: number;
  divergenceScore: number;
  reason?: string;
}

export interface MultiTierScanResult {
  isClean: boolean;
  recommendedStatus: 'TRUSTED' | 'QUARANTINED' | 'POISONED';
  heuristic: HeuristicScanResult;
  covert: CovertScanResult;
  contradiction: ContradictionResult;
  finalConsistencyMultiplier: number;
  riskSummary: string;
}

// 1. Direct Regex Pattern Scanner
const DIRECT_OVERRIDE_RULES = [
  { pattern: /(ignore|disregard|forget|override)\s+(all\s+)?(previous|prior|above|system)\s+(instructions|directives|prompts|rules)/i, name: 'Command Override' },
  { pattern: /(system override|developer mode|dan mode|jailbreak|sudo mode|admin access granted)/i, name: 'Privilege Escalation' },
  { pattern: /(```system|<system>|\[INST\]|<<SYS>>|<\|im_start\|>system)/i, name: 'Delimiter Hijacking' },
  { pattern: /(send.*to http|webhook\.site|curl -X POST|exfiltrate|fetch\(["']https?:\/\/)/i, name: 'Data Exfiltration' },
  { pattern: /(update|change|replace|switch)\s+(the\s+)?(bank account|iban|routing|beneficiary|wire transfer)\s+to/i, name: 'Payment Routing Hijack' },
  { pattern: /(print|reveal|leak|output)\s+(api[_-]?key|system prompt|secret|credential)/i, name: 'Credential Leak Attempt' },
  { pattern: /(urgent:\s*wire|unauthorized\s+change|bypass\s+approval)/i, name: 'Social Engineering Urgency' },
];

export function scanHeuristicPatterns(text: string): HeuristicScanResult {
  const matches: string[] = [];
  let maxSeverity = 0;

  for (const rule of DIRECT_OVERRIDE_RULES) {
    if (rule.pattern.test(text)) {
      matches.push(rule.name);
      maxSeverity = Math.max(maxSeverity, 0.90);
    }
  }

  return {
    hasOvertInjection: matches.length > 0,
    patternsDetected: matches,
    severity: maxSeverity,
  };
}

// Helper: Simple Vector Cosine Similarity using normalized word-frequency vectors
function vectorizeText(text: string): Record<string, number> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  // Normalize
  const magnitude = Math.sqrt(Object.values(freq).reduce((sum, v) => sum + v * v, 0)) || 1;
  const normalized: Record<string, number> = {};
  for (const [k, v] of Object.entries(freq)) {
    normalized[k] = v / magnitude;
  }
  return normalized;
}

function calculateCosineSimilarity(vecA: Record<string, number>, vecB: Record<string, number>): number {
  let dotProduct = 0;
  for (const key of Object.keys(vecA)) {
    if (vecB[key]) {
      dotProduct += vecA[key] * vecB[key];
    }
  }
  return dotProduct;
}

// Extract key entities (IBAN, account numbers, amounts, approval states)
function extractKeyEntities(text: string) {
  const ibanMatch = text.match(/\b([A-Z]{2}\d{2}[A-Z0-9]{11,30})\b/);
  const dollarMatch = text.match(/\$[\d,]+(?:\.\d+)?/);
  const hasNegativeOverride = /instead of|rather than|do not use|replaced with|reroute|cancel previous/i.test(text);

  return {
    iban: ibanMatch ? ibanMatch[1] : null,
    amount: dollarMatch ? dollarMatch[0] : null,
    hasNegativeOverride,
  };
}

// 3. Vector Semantic Contradiction Engine
export function checkSemanticContradiction(
  newText: string,
  existingHighTrustMemories: MemoryItem[]
): ContradictionResult {
  const newVec = vectorizeText(newText);
  const newEntities = extractKeyEntities(newText);

  for (const memory of existingHighTrustMemories) {
    // Only check against high-trust verified ground truth
    if (memory.effectiveTrust < 0.80 || memory.isTainted) continue;

    const existingVec = vectorizeText(memory.content);
    const similarity = calculateCosineSimilarity(newVec, existingVec);

    // If similarity is high (>0.60 topical overlap, e.g. both discuss Acme Corp banking details)
    if (similarity > 0.50) {
      const existingEntities = extractKeyEntities(memory.content);

      // Check for entity conflict (e.g. IBAN conflict or payout reroute)
      const hasIbanConflict = newEntities.iban && existingEntities.iban && newEntities.iban !== existingEntities.iban;
      const hasContradictoryInstruction = newEntities.hasNegativeOverride || hasIbanConflict;

      if (hasIbanConflict || hasContradictoryInstruction) {
        return {
          isContradiction: true,
          conflictingMemoryId: memory.id,
          topicSimilarity: parseFloat(similarity.toFixed(3)),
          divergenceScore: 0.92,
          reason: hasIbanConflict
            ? `Critical Conflict with ${memory.id}: Destination IBAN (${newEntities.iban}) contradicts verified baseline IBAN (${existingEntities.iban}).`
            : `Contradiction with ground truth memory ${memory.id}: Payload attempts to negate or divert verified baseline directives.`,
        };
      }
    }
  }

  return {
    isContradiction: false,
    topicSimilarity: 0,
    divergenceScore: 0,
  };
}

// 2. LLM Covert Classifier Client Call (with resilient fallback)
export async function scanCovertInstruction(
  content: string,
  context?: string
): Promise<CovertScanResult> {
  try {
    const res = await fetch('/api/scan-covert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, context }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        isCovertInjection: data.isCovertInjection,
        confidenceScore: data.confidenceScore,
        threatType: data.threatType,
        reasoning: data.reasoning,
        extractedDirectives: data.extractedDirectives || [],
      };
    }
  } catch (err) {
    console.warn('[MemGuard] Client call to /api/scan-covert failed, using heuristic fallback:', err);
  }

  // Fallback heuristic simulation if offline
  const heuristic = scanHeuristicPatterns(content);
  return {
    isCovertInjection: heuristic.hasOvertInjection,
    confidenceScore: heuristic.severity,
    threatType: heuristic.hasOvertInjection ? heuristic.patternsDetected[0] : 'BENIGN',
    reasoning: heuristic.hasOvertInjection
      ? `Heuristic scanner flagged pattern: ${heuristic.patternsDetected.join(', ')}`
      : 'No covert directives found.',
    extractedDirectives: heuristic.patternsDetected,
  };
}

// Master Multi-Tier Pipeline
export async function runMultiTierScan(
  content: string,
  existingHighTrustMemories: MemoryItem[],
  context?: string
): Promise<MultiTierScanResult> {
  // 1. Direct Regex
  const heuristic = scanHeuristicPatterns(content);

  // 2. Vector Contradiction
  const contradiction = checkSemanticContradiction(content, existingHighTrustMemories);

  // 3. Gemini Covert Classifier
  const covert = await scanCovertInstruction(content, context);

  let finalConsistencyMultiplier = 1.0;
  if (contradiction.isContradiction) {
    // Sharp penalty for factual contradiction against ground truth
    finalConsistencyMultiplier = 0.15;
  }

  const isPoisoned = heuristic.hasOvertInjection || covert.isCovertInjection;
  const isQuarantined = contradiction.isContradiction || (!isPoisoned && covert.confidenceScore > 0.40);

  let recommendedStatus: 'TRUSTED' | 'QUARANTINED' | 'POISONED' = 'TRUSTED';
  if (isPoisoned) {
    recommendedStatus = 'POISONED';
  } else if (isQuarantined) {
    recommendedStatus = 'QUARANTINED';
  }

  let riskSummary = 'Ingestion passed all security tiers cleanly.';
  if (isPoisoned) {
    riskSummary = `POISON DETECTED: ${covert.threatType || heuristic.patternsDetected[0]} (Confidence: ${Math.round(covert.confidenceScore * 100)}%). Directives: ${covert.extractedDirectives.join('; ')}`;
  } else if (contradiction.isContradiction) {
    riskSummary = `CONTRADICTION QUARANTINE: ${contradiction.reason}`;
  }

  return {
    isClean: !isPoisoned && !isQuarantined,
    recommendedStatus,
    heuristic,
    covert,
    contradiction,
    finalConsistencyMultiplier,
    riskSummary,
  };
}
