import * as text from "../../../../kit/text.js";
import { TieredRedemptionQuota } from "./tiered-redemption-quota.js";

/** A rule a tiered redemption quota must pass. Check returns its problems, or none. */
export interface TieredRedemptionQuotaRule {
  check(item: TieredRedemptionQuota): string[];
}

export class TieredRedemptionQuotaRequiredContactEmailRule implements TieredRedemptionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRedemptionQuota): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRedemptionQuotaDurationMinutesRangeRule implements TieredRedemptionQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRedemptionQuota): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredRedemptionQuotaSourceLengthRule implements TieredRedemptionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRedemptionQuota): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRedemptionQuotaRequiredLabelRule implements TieredRedemptionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRedemptionQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRedemptionQuotaAllowedTimezoneRule implements TieredRedemptionQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredRedemptionQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is inconsistent`];
    return [];
  }
}

export class TieredRedemptionQuotaCodeLengthRule implements TieredRedemptionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRedemptionQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered redemption quota. */
export class TieredRedemptionQuotaValidator {
  rules: TieredRedemptionQuotaRule[];

  constructor(rules: TieredRedemptionQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: TieredRedemptionQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredRedemptionQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredRedemptionQuota[]): Map<string, string[]> {
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

export function defaultTieredRedemptionQuotaValidator(): TieredRedemptionQuotaValidator {
  return new TieredRedemptionQuotaValidator(
    [
      new TieredRedemptionQuotaRequiredContactEmailRule("tiered redemption quota needs an entry"),
      new TieredRedemptionQuotaDurationMinutesRangeRule(80, 1000),
      new TieredRedemptionQuotaSourceLengthRule(64),
      new TieredRedemptionQuotaRequiredLabelRule("tiered redemption quota needs an entry"),
      new TieredRedemptionQuotaAllowedTimezoneRule(["pending"]),
      new TieredRedemptionQuotaCodeLengthRule(32),
    ],
  );
}
