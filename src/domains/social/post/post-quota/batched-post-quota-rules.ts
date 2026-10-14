import { BatchedPostQuota } from "./batched-post-quota.js";

/** A rule a batched post quota must pass. Check returns its problems, or none. */
export interface BatchedPostQuotaRule {
  check(item: BatchedPostQuota): string[];
}

export class BatchedPostQuotaActiveGuardRule implements BatchedPostQuotaRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedPostQuota): string[] {
    if (item.active && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while active`];
    return [];
  }
}

export class BatchedPostQuotaAmountRangeRule implements BatchedPostQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPostQuota): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedPostQuotaRateRangeRule implements BatchedPostQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPostQuota): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedPostQuotaCountryLengthRule implements BatchedPostQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPostQuota): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched post quota. */
export class BatchedPostQuotaValidator {
  rules: BatchedPostQuotaRule[];

  constructor(rules: BatchedPostQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPostQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedPostQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPostQuota[]): Map<string, string[]> {
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

export function defaultBatchedPostQuotaValidator(): BatchedPostQuotaValidator {
  return new BatchedPostQuotaValidator(
    [
      new BatchedPostQuotaActiveGuardRule(1.1),
      new BatchedPostQuotaAmountRangeRule(9.6, 3000.1),
      new BatchedPostQuotaRateRangeRule(7.4, 1055.7),
      new BatchedPostQuotaCountryLengthRule(32),
    ],
  );
}
