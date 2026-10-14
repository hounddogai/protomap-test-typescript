import * as text from "../../../../kit/text.js";
import { BatchedBranchAgreement } from "./batched-branch-agreement.js";

/** A rule a batched branch agreement must pass. Check returns its problems, or none. */
export interface BatchedBranchAgreementRule {
  check(item: BatchedBranchAgreement): string[];
}

export class BatchedBranchAgreementAllowedTitleRule implements BatchedBranchAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedBranchAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is below minimum`];
    return [];
  }
}

export class BatchedBranchAgreementRevisionRangeRule implements BatchedBranchAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedBranchAgreement): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedBranchAgreementCurrencyLengthRule implements BatchedBranchAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedBranchAgreement): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedBranchAgreementCodePrefixRule implements BatchedBranchAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedBranchAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a batched branch agreement. */
export class BatchedBranchAgreementValidator {
  rules: BatchedBranchAgreementRule[];

  constructor(rules: BatchedBranchAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedBranchAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedBranchAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedBranchAgreement[]): Map<string, string[]> {
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

export function defaultBatchedBranchAgreementValidator(): BatchedBranchAgreementValidator {
  return new BatchedBranchAgreementValidator(
    [
      new BatchedBranchAgreementAllowedTitleRule(["regional", "batched"]),
      new BatchedBranchAgreementRevisionRangeRule(16, 80),
      new BatchedBranchAgreementCurrencyLengthRule(120),
      new BatchedBranchAgreementCodePrefixRule("X"),
    ],
  );
}
