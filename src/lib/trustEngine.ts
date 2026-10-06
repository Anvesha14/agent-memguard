import { MemoryItem, SourceType } from './types';

export interface TrustEngineConfig {
  decayHalfLifeHours: number; // default 72h
  maxCorroborationBonus: number; // default 1.0
  quarantineThreshold: number; // default 0.75
  poisonThreshold: number; // default 0.40
}

export const DEFAULT_TRUST_CONFIG: TrustEngineConfig = {
  decayHalfLifeHours: 72,
  maxCorroborationBonus: 1.0,
  quarantineThreshold: 0.75,
  poisonThreshold: 0.40,
};

// Base reliability mappings by provenance tier
export const SOURCE_RELIABILITY_MAP: Record<SourceType, number> = {
  HARDWARE_ROOT: 1.0,
  AUDITED_DATABASE: 0.95,
  ENTERPRISE_API: 0.85,
  INTERNAL_REASONING: 0.80,
  AUTHENTICATED_EMAIL: 0.70,
  WEB_SCRAPE: 0.35,
  ANONYMOUS_WEBHOOK: 0.15,
};

export class TrustEngine {
  private config: TrustEngineConfig;

  constructor(config: Partial<TrustEngineConfig> = {}) {
    this.config = { ...DEFAULT_TRUST_CONFIG, ...config };
  }

  /**
   * Corroboration Factor:
   * 1 source = 0.75 multiplier
   * 2 sources = 0.88
   * 3+ sources = scales towards 1.0
   */
  public calculateCorroborationFactor(count: number): number {
    if (count <= 0) return 0.50;
    if (count === 1) return 0.75;
    if (count === 2) return 0.90;
    return Math.min(this.config.maxCorroborationBonus, 0.90 + (count - 2) * 0.05);
  }

  /**
   * Exponential Time Decay:
   * e^(-lambda * delta_hours)
   * where lambda = ln(2) / half_life
   */
  public calculateTimeDecay(createdAt: number, lastVerifiedAt: number, now: number = Date.now()): number {
    const effectiveTime = Math.max(createdAt, lastVerifiedAt);
    const deltaHours = Math.max(0, (now - effectiveTime) / (1000 * 60 * 60));
    const lambda = Math.log(2) / this.config.decayHalfLifeHours;
    return Math.exp(-lambda * deltaHours);
  }

  /**
   * Dynamic Multi-Factor Trust Formula:
   * Trust = Source_Reliability × Corroboration × Time_Decay × Consistency
   */
  public calculateRawTrust(
    sourceReliability: number,
    corroborationCount: number,
    createdAt: number,
    lastVerifiedAt: number,
    consistencyScore: number = 1.0,
    now: number = Date.now()
  ): {
    rawTrust: number;
    decayFactor: number;
    corroborationFactor: number;
  } {
    const corroborationFactor = this.calculateCorroborationFactor(corroborationCount);
    const decayFactor = this.calculateTimeDecay(createdAt, lastVerifiedAt, now);
    const safeConsistency = Math.max(0.05, Math.min(1.0, consistencyScore));

    const rawTrust = Math.max(
      0.0,
      Math.min(1.0, sourceReliability * corroborationFactor * decayFactor * safeConsistency)
    );

    return {
      rawTrust: parseFloat(rawTrust.toFixed(4)),
      decayFactor: parseFloat(decayFactor.toFixed(4)),
      corroborationFactor: parseFloat(corroborationFactor.toFixed(4)),
    };
  }

  /**
   * Anti-Laundering Inheritance Protocol:
   * Summaries, inferences, and derived memories automatically inherit min(Parent_Trust_Scores).
   * Summarization CANNOT clean or boost poisoned or quarantined data.
   */
  public applyAntiLaunderingInheritance(
    rawTrust: number,
    parentMemories: MemoryItem[]
  ): {
    effectiveTrust: number;
    isTainted: boolean;
    taintReason?: string;
  } {
    if (!parentMemories || parentMemories.length === 0) {
      return {
        effectiveTrust: rawTrust,
        isTainted: false,
      };
    }

    // Check if any parent is explicitly tainted
    const taintedParent = parentMemories.find(p => p.isTainted);
    if (taintedParent) {
      return {
        effectiveTrust: Math.min(rawTrust, taintedParent.effectiveTrust),
        isTainted: true,
        taintReason: `Taint inherited from parent ${taintedParent.id}: ${taintedParent.taintReason || 'Parent memory compromised'}`,
      };
    }

    // Lowest trust amongst all parent ancestors
    const minParentTrust = Math.min(...parentMemories.map(p => p.effectiveTrust));

    // Derived trust can NEVER exceed the weakest parent's trust
    const effectiveTrust = Math.min(rawTrust, minParentTrust);

    return {
      effectiveTrust: parseFloat(effectiveTrust.toFixed(4)),
      isTainted: effectiveTrust < this.config.poisonThreshold,
      taintReason: effectiveTrust < this.config.poisonThreshold
        ? `Inherited weak parent trust (${effectiveTrust.toFixed(2)}) below poison threshold`
        : undefined,
    };
  }

  public classifyStatus(effectiveTrust: number, isTainted: boolean): 'TRUSTED' | 'QUARANTINED' | 'POISONED' {
    if (isTainted || effectiveTrust < this.config.poisonThreshold) {
      return 'POISONED';
    }
    if (effectiveTrust < this.config.quarantineThreshold) {
      return 'QUARANTINED';
    }
    return 'TRUSTED';
  }
}

export const defaultTrustEngine = new TrustEngine();
