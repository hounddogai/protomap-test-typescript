import { TieredEnrollmentTier } from "./tiered-enrollment-tier.js";

/** A rule a tiered enrollment tier must pass. Check returns its problems, or none. */
export interface TieredEnrollmentTierRule {
  check(item: TieredEnrollmentTier): string[];
}

export class TieredEnrollmentTierRequiredCodeRule implements TieredEnrollmentTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredEnrollmentTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredEnrollmentTierImpressionsRangeRule implements TieredEnrollmentTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredEnrollmentTier): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredEnrollmentTierCodeLengthRule implements TieredEnrollmentTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredEnrollmentTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredEnrollmentTierRequiredLabelRule implements TieredEnrollmentTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredEnrollmentTier): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredEnrollmentTierSourceLengthRule implements TieredEnrollmentTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredEnrollmentTier): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredEnrollmentTierSummaryLengthRule implements TieredEnrollmentTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredEnrollmentTier): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered enrollment tier. */
export class TieredEnrollmentTierValidator {
  rules: TieredEnrollmentTierRule[];

  constructor(rules: TieredEnrollmentTierRule[]) {
    this.rules = rules;
  }

  validate(item: TieredEnrollmentTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredEnrollmentTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredEnrollmentTier[]): Map<string, string[]> {
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

export function defaultTieredEnrollmentTierValidator(): TieredEnrollmentTierValidator {
  return new TieredEnrollmentTierValidator(
    [
      new TieredEnrollmentTierRequiredCodeRule("tiered enrollment tier needs this field"),
      new TieredEnrollmentTierImpressionsRangeRule(255, 86400),
      new TieredEnrollmentTierCodeLengthRule(32),
      new TieredEnrollmentTierRequiredLabelRule("tiered enrollment tier needs this field"),
      new TieredEnrollmentTierSourceLengthRule(16),
      new TieredEnrollmentTierSummaryLengthRule(3600),
    ],
  );
}
