import * as text from "../../../../kit/text.js";
import { BranchThreshold } from "./branch-threshold.js";

/** A rule a branch threshold must pass. Check returns its problems, or none. */
export interface BranchThresholdRule {
  check(item: BranchThreshold): string[];
}

export class BranchThresholdBudgetRangeRule implements BranchThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchThreshold): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BranchThresholdAllowedTitleRule implements BranchThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BranchThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is missing`];
    return [];
  }
}

export class BranchThresholdTitleLengthRule implements BranchThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchThresholdApprovedGuardRule implements BranchThresholdRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BranchThreshold): string[] {
    if (item.approved && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class BranchThresholdCodePrefixRule implements BranchThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BranchThresholdCodeLengthRule implements BranchThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a branch threshold. */
export class BranchThresholdValidator {
  rules: BranchThresholdRule[];

  constructor(rules: BranchThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: BranchThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BranchThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchThreshold[]): Map<string, string[]> {
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

export function defaultBranchThresholdValidator(): BranchThresholdValidator {
  return new BranchThresholdValidator(
    [
      new BranchThresholdBudgetRangeRule(5.2, 1890.2),
      new BranchThresholdAllowedTitleRule(["scheduled", "default"]),
      new BranchThresholdTitleLengthRule(3600),
      new BranchThresholdApprovedGuardRule(4.9),
      new BranchThresholdCodePrefixRule("ACM"),
      new BranchThresholdCodeLengthRule(16),
    ],
  );
}
