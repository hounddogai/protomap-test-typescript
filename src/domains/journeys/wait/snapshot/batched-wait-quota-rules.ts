import { BatchedWaitQuota } from "./batched-wait-quota.js";

/** A rule a batched wait quota must pass. Check returns its problems, or none. */
export interface BatchedWaitQuotaRule {
  check(item: BatchedWaitQuota): string[];
}

export class BatchedWaitQuotaScoreRangeRule implements BatchedWaitQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedWaitQuota): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedWaitQuotaRequiredTitleRule implements BatchedWaitQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWaitQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedWaitQuotaRequiredReviewerRule implements BatchedWaitQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWaitQuota): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched wait quota. */
export class BatchedWaitQuotaValidator {
  rules: BatchedWaitQuotaRule[];

  constructor(rules: BatchedWaitQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedWaitQuota): string[] {
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

  requireValid(item: BatchedWaitQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedWaitQuota[]): Map<string, string[]> {
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

export function defaultBatchedWaitQuotaValidator(): BatchedWaitQuotaValidator {
  return new BatchedWaitQuotaValidator(
    [
      new BatchedWaitQuotaScoreRangeRule(1.4, 2857.6),
      new BatchedWaitQuotaRequiredTitleRule("batched wait quota needs an entry"),
      new BatchedWaitQuotaRequiredReviewerRule("batched wait quota needs an entry"),
    ],
  );
}
