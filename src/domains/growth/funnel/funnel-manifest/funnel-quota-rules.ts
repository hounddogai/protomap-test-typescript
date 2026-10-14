import { FunnelQuota } from "./funnel-quota.js";

/** A rule a funnel quota must pass. Check returns its problems, or none. */
export interface FunnelQuotaRule {
  check(item: FunnelQuota): string[];
}

export class FunnelQuotaRateRangeRule implements FunnelQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelQuota): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FunnelQuotaThresholdRangeRule implements FunnelQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelQuota): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FunnelQuotaAmountRangeRule implements FunnelQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelQuota): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a funnel quota. */
export class FunnelQuotaValidator {
  rules: FunnelQuotaRule[];

  constructor(rules: FunnelQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelQuota): string[] {
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

  requireValid(item: FunnelQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelQuota[]): Map<string, string[]> {
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

export function defaultFunnelQuotaValidator(): FunnelQuotaValidator {
  return new FunnelQuotaValidator(
    [
      new FunnelQuotaRateRangeRule(7.8, 146.4),
      new FunnelQuotaThresholdRangeRule(8.4, 3298.2),
      new FunnelQuotaAmountRangeRule(3.9, 1837.1),
    ],
  );
}
