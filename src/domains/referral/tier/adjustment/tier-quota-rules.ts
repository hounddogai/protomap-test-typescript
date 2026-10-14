import { TierQuota } from "./tier-quota.js";

/** A rule a tier quota must pass. Check returns its problems, or none. */
export interface TierQuotaRule {
  check(item: TierQuota): string[];
}

export class TierQuotaRequiredRegionRule implements TierQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierQuota): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class TierQuotaCodeLengthRule implements TierQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierQuotaFrequencyCapRangeRule implements TierQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierQuota): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TierQuotaRequiredCodeRule implements TierQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tier quota. */
export class TierQuotaValidator {
  rules: TierQuotaRule[];

  constructor(rules: TierQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: TierQuota): string[] {
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

  requireValid(item: TierQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierQuota[]): Map<string, string[]> {
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

export function defaultTierQuotaValidator(): TierQuotaValidator {
  return new TierQuotaValidator(
    [
      new TierQuotaRequiredRegionRule("tier quota needs this field"),
      new TierQuotaCodeLengthRule(16),
      new TierQuotaFrequencyCapRangeRule(64, 64),
      new TierQuotaRequiredCodeRule("tier quota needs this field"),
    ],
  );
}
