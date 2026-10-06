import { ToolPolicy, ActionInvocation, RiskLevel, MemoryItem } from './types';
import { LedgerGraphManager } from './ledgerGraph';

export const TOOL_SECURITY_POLICIES: Record<string, ToolPolicy> = {
  send_payment: {
    toolName: 'send_payment',
    riskLevel: 'CRITICAL',
    minTrustRequired: 0.85,
    requiresHumanReview: true,
    description: 'Transfers funds, updates payment routes, or triggers wire transactions.',
  },
  delete_database: {
    toolName: 'delete_database',
    riskLevel: 'CRITICAL',
    minTrustRequired: 0.95,
    requiresHumanReview: true,
    description: 'Permanently purges tables or drops database instances.',
  },
  modify_credentials: {
    toolName: 'modify_credentials',
    riskLevel: 'HIGH',
    minTrustRequired: 0.90,
    requiresHumanReview: true,
    description: 'Rotates API keys, modifies IAM permissions, or registers SSH keys.',
  },
  send_external_email: {
    toolName: 'send_external_email',
    riskLevel: 'MEDIUM',
    minTrustRequired: 0.65,
    requiresHumanReview: false,
    description: 'Dispatches communications to external domains.',
  },
  update_customer_crm: {
    toolName: 'update_customer_crm',
    riskLevel: 'MEDIUM',
    minTrustRequired: 0.60,
    requiresHumanReview: false,
    description: 'Updates customer contact addresses, phone numbers, or preferences.',
  },
  read_public_file: {
    toolName: 'read_public_file',
    riskLevel: 'LOW',
    minTrustRequired: 0.40,
    requiresHumanReview: false,
    description: 'Reads public documentation, release notes, or static feeds.',
  },
  query_analytics: {
    toolName: 'query_analytics',
    riskLevel: 'LOW',
    minTrustRequired: 0.40,
    requiresHumanReview: false,
    description: 'Runs read-only metrics queries on telemetry data.',
  },
};

export class ActionGuard {
  private policies: Map<string, ToolPolicy> = new Map();
  private auditLog: ActionInvocation[] = [];

  constructor(customPolicies?: ToolPolicy[]) {
    for (const [name, pol] of Object.entries(TOOL_SECURITY_POLICIES)) {
      this.policies.set(name, pol);
    }
    if (customPolicies) {
      for (const pol of customPolicies) {
        this.policies.set(pol.toolName, pol);
      }
    }
  }

  public getPolicies(): ToolPolicy[] {
    return Array.from(this.policies.values());
  }

  public getAuditLog(): ActionInvocation[] {
    return [...this.auditLog];
  }

  /**
   * Recursively collect all ancestor memories for provenance inspection
   */
  private gatherAncestors(memoryId: string, graph: LedgerGraphManager): MemoryItem[] {
    const ancestors: MemoryItem[] = [];
    const visited = new Set<string>();
    const queue = [memoryId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const mem = graph.getMemory(currentId);
      if (mem) {
        ancestors.push(mem);
        for (const pId of mem.parentIds) {
          if (!visited.has(pId)) {
            queue.push(pId);
          }
        }
      }
    }

    return ancestors;
  }

  /**
   * Evaluate a requested agent action against Zero-Trust policies and provenance ancestry
   */
  public evaluateAction(
    toolName: string,
    parameters: Record<string, any>,
    planMemoryId: string,
    graph: LedgerGraphManager
  ): ActionInvocation {
    const policy = this.policies.get(toolName) || {
      toolName,
      riskLevel: 'HIGH' as RiskLevel,
      minTrustRequired: 0.85,
      requiresHumanReview: true,
      description: 'Unclassified tool action (defaulted to zero-trust high risk)',
    };

    const planMem = graph.getMemory(planMemoryId);
    const ancestors = this.gatherAncestors(planMemoryId, graph);

    // Find any tainted nodes in the ancestry tree
    const taintedAncestors = ancestors.filter(a => a.isTainted || a.status === 'POISONED').map(a => a.id);

    // Calculate effective provenance trust: lowest trust in the ancestry lineage
    const minLineageTrust = ancestors.length > 0
      ? Math.min(...ancestors.map(a => a.effectiveTrust))
      : (planMem ? planMem.effectiveTrust : 0.0);

    const invocationId = `ACT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    let status: ActionInvocation['status'] = 'APPROVED';
    let blockReason: string | undefined = undefined;

    // Check 1: Taint in ancestry tree
    if (taintedAncestors.length > 0) {
      status = 'BLOCKED';
      blockReason = `ZERO-TRUST POLICY VIOLATION: Action relies on tainted ancestor memories [${taintedAncestors.join(', ')}]. Blast radius isolation engaged.`;
    }
    // Check 2: Trust score falls short of required threshold
    else if (minLineageTrust < policy.minTrustRequired) {
      if (policy.requiresHumanReview) {
        status = 'PENDING_HUMAN_APPROVAL';
        blockReason = `LINEAGE TRUST DEFICIT (${minLineageTrust.toFixed(2)} < required ${policy.minTrustRequired.toFixed(2)}). Escalated to Human-In-The-Loop gatekeeper.`;
      } else {
        status = 'BLOCKED';
        blockReason = `INSUFFICIENT TRUST (${minLineageTrust.toFixed(2)} < required ${policy.minTrustRequired.toFixed(2)}). Automated execution denied.`;
      }
    }
    // Check 3: Critical risk tool that explicitly enforces human confirmation even if trust is high
    else if (policy.riskLevel === 'CRITICAL' && policy.requiresHumanReview) {
      status = 'PENDING_HUMAN_APPROVAL';
      blockReason = `CRITICAL ACTION POLICY: High-risk financial/system modification requires explicit Human-In-The-Loop cryptographic authorization.`;
    }

    const invocation: ActionInvocation = {
      id: invocationId,
      toolName,
      parameters,
      originatingMemoryId: ancestors[ancestors.length - 1]?.id || planMemoryId,
      planMemoryId,
      timestamp: Date.now(),
      status,
      riskLevel: policy.riskLevel,
      blockReason,
      evaluatedTrust: minLineageTrust,
      taintedAncestors,
    };

    this.auditLog.unshift(invocation);
    return invocation;
  }

  public resolveHumanApproval(actionId: string, approved: boolean, reason?: string): ActionInvocation | null {
    const action = this.auditLog.find(a => a.id === actionId);
    if (!action) return null;

    if (approved) {
      action.status = 'APPROVED';
      action.blockReason = reason ? `Approved by Security Admin: ${reason}` : 'Approved by Security Admin via Human-In-The-Loop Gatekeeper.';
    } else {
      action.status = 'BLOCKED';
      action.blockReason = reason ? `Rejected by Security Admin: ${reason}` : 'Explicitly Rejected by Security Admin.';
    }

    return action;
  }
}
