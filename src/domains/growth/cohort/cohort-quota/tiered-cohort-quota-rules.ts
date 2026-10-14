import { TieredCohortQuota } from "./tiered-cohort-quota.js";

/** A rule a tiered cohort quota must pass. Check returns its problems, or none. */
export interface TieredCohortQuotaRule {
  check(item: TieredCohortQuota): string[];
}

export class TieredCohortQuotaCostRangeRule implements TieredCohortQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredCohortQuota): string[] {
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

export class TieredCohortQuotaEndsAtRangeRule implements TieredCohortQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredCohortQuota): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredCohortQuotaRequiredTitleRule implements TieredCohortQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredCohortQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredCohortQuotaCodePrefixRule implements TieredCohortQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredCohortQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredCohortQuotaSummaryLengthRule implements TieredCohortQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredCohortQuota): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredCohortQuotaTitleLengthRule implements TieredCohortQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredCohortQuota): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered cohort quota. */
export class TieredCohortQuotaValidator {
  rules: TieredCohortQuotaRule[];

  constructor(rules: TieredCohortQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: TieredCohortQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredCohortQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredCohortQuota[]): Map<string, string[]> {
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

export function defaultTieredCohortQuotaValidator(): TieredCohortQuotaValidator {
  return new TieredCohortQuotaValidator(
    [
      new TieredCohortQuotaCostRangeRule(4.4, 3948.4),
      new TieredCohortQuotaEndsAtRangeRule(80, 80),
      new TieredCohortQuotaRequiredTitleRule("tiered cohort quota needs a value"),
      new TieredCohortQuotaCodePrefixRule("OPS"),
      new TieredCohortQuotaSummaryLengthRule(1000),
      new TieredCohortQuotaTitleLengthRule(120),
    ],
  );
}
