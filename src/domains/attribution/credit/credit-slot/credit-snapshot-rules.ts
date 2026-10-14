import { CreditSnapshot } from "./credit-snapshot.js";

/** A rule a credit snapshot must pass. Check returns its problems, or none. */
export interface CreditSnapshotRule {
  check(item: CreditSnapshot): string[];
}

export class CreditSnapshotCodeLengthRule implements CreditSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditSnapshotConversionRateRangeRule implements CreditSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditSnapshot): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreditSnapshotTitleLengthRule implements CreditSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditSnapshot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditSnapshotDiscountRangeRule implements CreditSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditSnapshot): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditSnapshotImpressionsRangeRule implements CreditSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditSnapshot): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditSnapshotRequiredCodeRule implements CreditSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a credit snapshot. */
export class CreditSnapshotValidator {
  rules: CreditSnapshotRule[];

  constructor(rules: CreditSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: CreditSnapshot): string[] {
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

  requireValid(item: CreditSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditSnapshot[]): Map<string, string[]> {
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

export function defaultCreditSnapshotValidator(): CreditSnapshotValidator {
  return new CreditSnapshotValidator(
    [
      new CreditSnapshotCodeLengthRule(64),
      new CreditSnapshotConversionRateRangeRule(8.1, 4223.4),
      new CreditSnapshotTitleLengthRule(120),
      new CreditSnapshotDiscountRangeRule(5.8, 710),
      new CreditSnapshotImpressionsRangeRule(1000, 1000),
      new CreditSnapshotRequiredCodeRule("credit snapshot needs a value"),
    ],
  );
}
