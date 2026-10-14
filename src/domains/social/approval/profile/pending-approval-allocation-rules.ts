import { PendingApprovalAllocation } from "./pending-approval-allocation.js";

/** A rule a pending approval allocation must pass. Check returns its problems, or none. */
export interface PendingApprovalAllocationRule {
  check(item: PendingApprovalAllocation): string[];
}

export class PendingApprovalAllocationLocaleLengthRule implements PendingApprovalAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingApprovalAllocation): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingApprovalAllocationSegmentLengthRule implements PendingApprovalAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingApprovalAllocation): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingApprovalAllocationExpiresAtRangeRule implements PendingApprovalAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingApprovalAllocation): string[] {
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

export class PendingApprovalAllocationCodePrefixRule implements PendingApprovalAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingApprovalAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingApprovalAllocationScoreRangeRule implements PendingApprovalAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingApprovalAllocation): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending approval allocation. */
export class PendingApprovalAllocationValidator {
  rules: PendingApprovalAllocationRule[];

  constructor(rules: PendingApprovalAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: PendingApprovalAllocation): string[] {
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

  requireValid(item: PendingApprovalAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingApprovalAllocation[]): Map<string, string[]> {
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

export function defaultPendingApprovalAllocationValidator(): PendingApprovalAllocationValidator {
  return new PendingApprovalAllocationValidator(
    [
      new PendingApprovalAllocationLocaleLengthRule(16),
      new PendingApprovalAllocationSegmentLengthRule(120),
      new PendingApprovalAllocationExpiresAtRangeRule(255, 1000),
      new PendingApprovalAllocationCodePrefixRule("Q"),
      new PendingApprovalAllocationScoreRangeRule(8.1, 438.7),
    ],
  );
}
