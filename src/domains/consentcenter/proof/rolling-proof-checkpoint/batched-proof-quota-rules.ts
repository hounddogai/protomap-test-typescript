import { BatchedProofQuota } from "./batched-proof-quota.js";

/** A rule a batched proof quota must pass. Check returns its problems, or none. */
export interface BatchedProofQuotaRule {
  check(item: BatchedProofQuota): string[];
}

export class BatchedProofQuotaQuantityRangeRule implements BatchedProofQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedProofQuota): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedProofQuotaCampaignRefLengthRule implements BatchedProofQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedProofQuota): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedProofQuotaRequiredLocaleRule implements BatchedProofQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedProofQuota): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedProofQuotaRequiredCampaignRefRule implements BatchedProofQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedProofQuota): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched proof quota. */
export class BatchedProofQuotaValidator {
  rules: BatchedProofQuotaRule[];

  constructor(rules: BatchedProofQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedProofQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedProofQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedProofQuota[]): Map<string, string[]> {
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

export function defaultBatchedProofQuotaValidator(): BatchedProofQuotaValidator {
  return new BatchedProofQuotaValidator(
    [
      new BatchedProofQuotaQuantityRangeRule(120, 3600),
      new BatchedProofQuotaCampaignRefLengthRule(32),
      new BatchedProofQuotaRequiredLocaleRule("batched proof quota needs a value"),
      new BatchedProofQuotaRequiredCampaignRefRule("batched proof quota needs an entry"),
    ],
  );
}
