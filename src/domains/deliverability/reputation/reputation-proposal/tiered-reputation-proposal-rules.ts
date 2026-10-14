import * as text from "../../../../kit/text.js";
import { TieredReputationProposal } from "./tiered-reputation-proposal.js";

/** A rule a tiered reputation proposal must pass. Check returns its problems, or none. */
export interface TieredReputationProposalRule {
  check(item: TieredReputationProposal): string[];
}

export class TieredReputationProposalAllowedSummaryRule implements TieredReputationProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredReputationProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is expired`];
    return [];
  }
}

export class TieredReputationProposalSummaryLengthRule implements TieredReputationProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredReputationProposal): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredReputationProposalApprovedGuardRule implements TieredReputationProposalRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredReputationProposal): string[] {
    if (item.approved && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class TieredReputationProposalBudgetRangeRule implements TieredReputationProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredReputationProposal): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered reputation proposal. */
export class TieredReputationProposalValidator {
  rules: TieredReputationProposalRule[];

  constructor(rules: TieredReputationProposalRule[]) {
    this.rules = rules;
  }

  validate(item: TieredReputationProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredReputationProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredReputationProposal[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultTieredReputationProposalValidator(): TieredReputationProposalValidator {
  return new TieredReputationProposalValidator(
    [
      new TieredReputationProposalAllowedSummaryRule(["regional"]),
      new TieredReputationProposalSummaryLengthRule(255),
      new TieredReputationProposalApprovedGuardRule(1.9),
      new TieredReputationProposalBudgetRangeRule(2.8, 2998.4),
    ],
  );
}
