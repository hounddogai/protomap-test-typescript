import { BatchedRewardRuleQuota } from "./batched-reward-rule-quota.js";

/** A rule a batched reward rule quota must pass. Check returns its problems, or none. */
export interface BatchedRewardRuleQuotaRule {
  check(item: BatchedRewardRuleQuota): string[];
}

export class BatchedRewardRuleQuotaUtmSourceLengthRule implements BatchedRewardRuleQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedRewardRuleQuota): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedRewardRuleQuotaPinnedGuardRule implements BatchedRewardRuleQuotaRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedRewardRuleQuota): string[] {
    if (item.pinned && item.margin > this.limit) return [`margin ${item.margin} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class BatchedRewardRuleQuotaCodePrefixRule implements BatchedRewardRuleQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedRewardRuleQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedRewardRuleQuotaCodeLengthRule implements BatchedRewardRuleQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedRewardRuleQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedRewardRuleQuotaAttemptsRangeRule implements BatchedRewardRuleQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedRewardRuleQuota): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedRewardRuleQuotaRequiredCountryRule implements BatchedRewardRuleQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedRewardRuleQuota): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched reward rule quota. */
export class BatchedRewardRuleQuotaValidator {
  rules: BatchedRewardRuleQuotaRule[];

  constructor(rules: BatchedRewardRuleQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedRewardRuleQuota): string[] {
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

  requireValid(item: BatchedRewardRuleQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedRewardRuleQuota[]): Map<string, string[]> {
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

export function defaultBatchedRewardRuleQuotaValidator(): BatchedRewardRuleQuotaValidator {
  return new BatchedRewardRuleQuotaValidator(
    [
      new BatchedRewardRuleQuotaUtmSourceLengthRule(16),
      new BatchedRewardRuleQuotaPinnedGuardRule(9.9),
      new BatchedRewardRuleQuotaCodePrefixRule("REF"),
      new BatchedRewardRuleQuotaCodeLengthRule(32),
      new BatchedRewardRuleQuotaAttemptsRangeRule(80, 255),
      new BatchedRewardRuleQuotaRequiredCountryRule("batched reward rule quota needs this field"),
    ],
  );
}
