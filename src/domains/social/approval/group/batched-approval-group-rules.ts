import * as text from "../../../../kit/text.js";
import { BatchedApprovalGroup } from "./batched-approval-group.js";

/** A rule a batched approval group must pass. Check returns its problems, or none. */
export interface BatchedApprovalGroupRule {
  check(item: BatchedApprovalGroup): string[];
}

export class BatchedApprovalGroupGraceDaysRangeRule implements BatchedApprovalGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedApprovalGroup): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedApprovalGroupAllowedUtmSourceRule implements BatchedApprovalGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedApprovalGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is not allowed`];
    return [];
  }
}

export class BatchedApprovalGroupCodePrefixRule implements BatchedApprovalGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedApprovalGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a batched approval group. */
export class BatchedApprovalGroupValidator {
  rules: BatchedApprovalGroupRule[];

  constructor(rules: BatchedApprovalGroupRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedApprovalGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedApprovalGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedApprovalGroup[]): Map<string, string[]> {
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

export function defaultBatchedApprovalGroupValidator(): BatchedApprovalGroupValidator {
  return new BatchedApprovalGroupValidator(
    [
      new BatchedApprovalGroupGraceDaysRangeRule(3600, 86400),
      new BatchedApprovalGroupAllowedUtmSourceRule([]),
      new BatchedApprovalGroupCodePrefixRule("ACM"),
    ],
  );
}
