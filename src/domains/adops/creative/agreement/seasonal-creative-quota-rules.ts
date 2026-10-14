import * as text from "../../../../kit/text.js";
import { SeasonalCreativeQuota } from "./seasonal-creative-quota.js";

/** A rule a seasonal creative quota must pass. Check returns its problems, or none. */
export interface SeasonalCreativeQuotaRule {
  check(item: SeasonalCreativeQuota): string[];
}

export class SeasonalCreativeQuotaWindowDaysRangeRule implements SeasonalCreativeQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalCreativeQuota): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalCreativeQuotaLabelLengthRule implements SeasonalCreativeQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalCreativeQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalCreativeQuotaExpiresAtRangeRule implements SeasonalCreativeQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalCreativeQuota): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalCreativeQuotaCodePrefixRule implements SeasonalCreativeQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalCreativeQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalCreativeQuotaAllowedLabelRule implements SeasonalCreativeQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalCreativeQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is above maximum`];
    return [];
  }
}

/** Runs every rule of a seasonal creative quota. */
export class SeasonalCreativeQuotaValidator {
  rules: SeasonalCreativeQuotaRule[];

  constructor(rules: SeasonalCreativeQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalCreativeQuota): string[] {
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

  requireValid(item: SeasonalCreativeQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalCreativeQuota[]): Map<string, string[]> {
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

export function defaultSeasonalCreativeQuotaValidator(): SeasonalCreativeQuotaValidator {
  return new SeasonalCreativeQuotaValidator(
    [
      new SeasonalCreativeQuotaWindowDaysRangeRule(120, 255),
      new SeasonalCreativeQuotaLabelLengthRule(64),
      new SeasonalCreativeQuotaExpiresAtRangeRule(32, 255),
      new SeasonalCreativeQuotaCodePrefixRule("ACM"),
      new SeasonalCreativeQuotaAllowedLabelRule(["fallback", "pending", "adaptive"]),
    ],
  );
}
