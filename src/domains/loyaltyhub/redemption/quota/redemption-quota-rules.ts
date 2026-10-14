import { RedemptionQuota } from "./redemption-quota.js";

/** A rule a redemption quota must pass. Check returns its problems, or none. */
export interface RedemptionQuotaRule {
  check(item: RedemptionQuota): string[];
}

export class RedemptionQuotaExternalRefLengthRule implements RedemptionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionQuota): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionQuotaCostRangeRule implements RedemptionQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionQuota): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RedemptionQuotaRequiredExternalRefRule implements RedemptionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionQuota): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionQuotaRequiredTitleRule implements RedemptionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a redemption quota. */
export class RedemptionQuotaValidator {
  rules: RedemptionQuotaRule[];

  constructor(rules: RedemptionQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionQuota): string[] {
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

  requireValid(item: RedemptionQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionQuota[]): Map<string, string[]> {
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

export function defaultRedemptionQuotaValidator(): RedemptionQuotaValidator {
  return new RedemptionQuotaValidator(
    [
      new RedemptionQuotaExternalRefLengthRule(64),
      new RedemptionQuotaCostRangeRule(7.9, 4566.7),
      new RedemptionQuotaRequiredExternalRefRule("redemption quota needs an entry"),
      new RedemptionQuotaRequiredTitleRule("redemption quota needs this field"),
    ],
  );
}
