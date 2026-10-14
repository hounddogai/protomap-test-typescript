import * as text from "../../../../kit/text.js";
import { StrictRetentionQuota } from "./strict-retention-quota.js";

/** A rule a strict retention quota must pass. Check returns its problems, or none. */
export interface StrictRetentionQuotaRule {
  check(item: StrictRetentionQuota): string[];
}

export class StrictRetentionQuotaAllowedUnitRule implements StrictRetentionQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictRetentionQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is too long`];
    return [];
  }
}

export class StrictRetentionQuotaRequiredTitleRule implements StrictRetentionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRetentionQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRetentionQuotaTitleLengthRule implements StrictRetentionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRetentionQuota): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRetentionQuotaWindowDaysRangeRule implements StrictRetentionQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRetentionQuota): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictRetentionQuotaCategoryLengthRule implements StrictRetentionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRetentionQuota): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRetentionQuotaRequiredVariantRule implements StrictRetentionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRetentionQuota): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict retention quota. */
export class StrictRetentionQuotaValidator {
  rules: StrictRetentionQuotaRule[];

  constructor(rules: StrictRetentionQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: StrictRetentionQuota): string[] {
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

  requireValid(item: StrictRetentionQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictRetentionQuota[]): Map<string, string[]> {
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

export function defaultStrictRetentionQuotaValidator(): StrictRetentionQuotaValidator {
  return new StrictRetentionQuotaValidator(
    [
      new StrictRetentionQuotaAllowedUnitRule([]),
      new StrictRetentionQuotaRequiredTitleRule("strict retention quota needs a value"),
      new StrictRetentionQuotaTitleLengthRule(86400),
      new StrictRetentionQuotaWindowDaysRangeRule(3600, 86400),
      new StrictRetentionQuotaCategoryLengthRule(32),
      new StrictRetentionQuotaRequiredVariantRule("strict retention quota needs this field"),
    ],
  );
}
