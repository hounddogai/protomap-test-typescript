import * as text from "../../../../kit/text.js";
import { StrictRedemptionQuota } from "./strict-redemption-quota.js";

/** A rule a strict redemption quota must pass. Check returns its problems, or none. */
export interface StrictRedemptionQuotaRule {
  check(item: StrictRedemptionQuota): string[];
}

export class StrictRedemptionQuotaAllowedTitleRule implements StrictRedemptionQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictRedemptionQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

export class StrictRedemptionQuotaRequiredTitleRule implements StrictRedemptionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRedemptionQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRedemptionQuotaCodeLengthRule implements StrictRedemptionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRedemptionQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRedemptionQuotaRegionLengthRule implements StrictRedemptionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRedemptionQuota): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRedemptionQuotaQuantityRangeRule implements StrictRedemptionQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRedemptionQuota): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictRedemptionQuotaRequiredCodeRule implements StrictRedemptionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRedemptionQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict redemption quota. */
export class StrictRedemptionQuotaValidator {
  rules: StrictRedemptionQuotaRule[];

  constructor(rules: StrictRedemptionQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: StrictRedemptionQuota): string[] {
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

  requireValid(item: StrictRedemptionQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictRedemptionQuota[]): Map<string, string[]> {
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

export function defaultStrictRedemptionQuotaValidator(): StrictRedemptionQuotaValidator {
  return new StrictRedemptionQuotaValidator(
    [
      new StrictRedemptionQuotaAllowedTitleRule([]),
      new StrictRedemptionQuotaRequiredTitleRule("strict redemption quota needs this field"),
      new StrictRedemptionQuotaCodeLengthRule(1000),
      new StrictRedemptionQuotaRegionLengthRule(32),
      new StrictRedemptionQuotaQuantityRangeRule(120, 86400),
      new StrictRedemptionQuotaRequiredCodeRule("strict redemption quota needs this field"),
    ],
  );
}
