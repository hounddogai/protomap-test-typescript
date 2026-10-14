import { AdaptiveBadgeQuota } from "./adaptive-badge-quota.js";

/** A rule a adaptive badge quota must pass. Check returns its problems, or none. */
export interface AdaptiveBadgeQuotaRule {
  check(item: AdaptiveBadgeQuota): string[];
}

export class AdaptiveBadgeQuotaBudgetRangeRule implements AdaptiveBadgeQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveBadgeQuota): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveBadgeQuotaVariantLengthRule implements AdaptiveBadgeQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveBadgeQuota): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveBadgeQuotaRevisionRangeRule implements AdaptiveBadgeQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveBadgeQuota): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveBadgeQuotaRequiredSummaryRule implements AdaptiveBadgeQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveBadgeQuota): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive badge quota. */
export class AdaptiveBadgeQuotaValidator {
  rules: AdaptiveBadgeQuotaRule[];

  constructor(rules: AdaptiveBadgeQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveBadgeQuota): string[] {
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

  requireValid(item: AdaptiveBadgeQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveBadgeQuota[]): Map<string, string[]> {
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

export function defaultAdaptiveBadgeQuotaValidator(): AdaptiveBadgeQuotaValidator {
  return new AdaptiveBadgeQuotaValidator(
    [
      new AdaptiveBadgeQuotaBudgetRangeRule(0.9, 2626.7),
      new AdaptiveBadgeQuotaVariantLengthRule(120),
      new AdaptiveBadgeQuotaRevisionRangeRule(64, 86400),
      new AdaptiveBadgeQuotaRequiredSummaryRule("adaptive badge quota needs this field"),
    ],
  );
}
