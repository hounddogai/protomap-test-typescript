import { ManualReputationClaim } from "./manual-reputation-claim.js";

/** A rule a manual reputation claim must pass. Check returns its problems, or none. */
export interface ManualReputationClaimRule {
  check(item: ManualReputationClaim): string[];
}

export class ManualReputationClaimApprovedGuardRule implements ManualReputationClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ManualReputationClaim): string[] {
    if (item.approved && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class ManualReputationClaimCostRangeRule implements ManualReputationClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualReputationClaim): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualReputationClaimExpiresAtRangeRule implements ManualReputationClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualReputationClaim): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualReputationClaimReviewerLengthRule implements ManualReputationClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualReputationClaim): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual reputation claim. */
export class ManualReputationClaimValidator {
  rules: ManualReputationClaimRule[];

  constructor(rules: ManualReputationClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ManualReputationClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: ManualReputationClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualReputationClaim[]): Map<string, string[]> {
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

export function defaultManualReputationClaimValidator(): ManualReputationClaimValidator {
  return new ManualReputationClaimValidator(
    [
      new ManualReputationClaimApprovedGuardRule(1000),
      new ManualReputationClaimCostRangeRule(0.3, 1184.1),
      new ManualReputationClaimExpiresAtRangeRule(255, 1000),
      new ManualReputationClaimReviewerLengthRule(80),
    ],
  );
}
