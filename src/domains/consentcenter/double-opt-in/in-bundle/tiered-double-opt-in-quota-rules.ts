import { TieredDoubleOptInQuota } from "./tiered-double-opt-in-quota.js";

/** A rule a tiered double opt in quota must pass. Check returns its problems, or none. */
export interface TieredDoubleOptInQuotaRule {
  check(item: TieredDoubleOptInQuota): string[];
}

export class TieredDoubleOptInQuotaCodeLengthRule implements TieredDoubleOptInQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDoubleOptInQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDoubleOptInQuotaArchivedGuardRule implements TieredDoubleOptInQuotaRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredDoubleOptInQuota): string[] {
    if (item.archived && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class TieredDoubleOptInQuotaSourceLengthRule implements TieredDoubleOptInQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDoubleOptInQuota): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDoubleOptInQuotaNameLengthRule implements TieredDoubleOptInQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDoubleOptInQuota): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDoubleOptInQuotaRetriesRangeRule implements TieredDoubleOptInQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredDoubleOptInQuota): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredDoubleOptInQuotaRequiredNameRule implements TieredDoubleOptInQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredDoubleOptInQuota): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered double opt in quota. */
export class TieredDoubleOptInQuotaValidator {
  rules: TieredDoubleOptInQuotaRule[];

  constructor(rules: TieredDoubleOptInQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: TieredDoubleOptInQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredDoubleOptInQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredDoubleOptInQuota[]): Map<string, string[]> {
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

export function defaultTieredDoubleOptInQuotaValidator(): TieredDoubleOptInQuotaValidator {
  return new TieredDoubleOptInQuotaValidator(
    [
      new TieredDoubleOptInQuotaCodeLengthRule(80),
      new TieredDoubleOptInQuotaArchivedGuardRule(8.9),
      new TieredDoubleOptInQuotaSourceLengthRule(80),
      new TieredDoubleOptInQuotaNameLengthRule(255),
      new TieredDoubleOptInQuotaRetriesRangeRule(255, 86400),
      new TieredDoubleOptInQuotaRequiredNameRule("tiered double opt in quota needs this field"),
    ],
  );
}
