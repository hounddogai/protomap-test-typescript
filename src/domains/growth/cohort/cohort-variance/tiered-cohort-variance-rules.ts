import { TieredCohortVariance } from "./tiered-cohort-variance.js";

/** A rule a tiered cohort variance must pass. Check returns its problems, or none. */
export interface TieredCohortVarianceRule {
  check(item: TieredCohortVariance): string[];
}

export class TieredCohortVariancePhoneLengthRule implements TieredCohortVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredCohortVariance): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredCohortVarianceRequiredLabelRule implements TieredCohortVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredCohortVariance): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredCohortVarianceRequiredUnitRule implements TieredCohortVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredCohortVariance): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class TieredCohortVarianceLabelLengthRule implements TieredCohortVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredCohortVariance): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredCohortVarianceCodeLengthRule implements TieredCohortVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredCohortVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredCohortVarianceQuantityRangeRule implements TieredCohortVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredCohortVariance): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered cohort variance. */
export class TieredCohortVarianceValidator {
  rules: TieredCohortVarianceRule[];

  constructor(rules: TieredCohortVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: TieredCohortVariance): string[] {
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

  requireValid(item: TieredCohortVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredCohortVariance[]): Map<string, string[]> {
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

export function defaultTieredCohortVarianceValidator(): TieredCohortVarianceValidator {
  return new TieredCohortVarianceValidator(
    [
      new TieredCohortVariancePhoneLengthRule(3600),
      new TieredCohortVarianceRequiredLabelRule("tiered cohort variance needs a value"),
      new TieredCohortVarianceRequiredUnitRule("tiered cohort variance needs this field"),
      new TieredCohortVarianceLabelLengthRule(120),
      new TieredCohortVarianceCodeLengthRule(80),
      new TieredCohortVarianceQuantityRangeRule(64, 1000),
    ],
  );
}
