import { TieredSuppressionEstimate } from "./tiered-suppression-estimate.js";

/** A rule a tiered suppression estimate must pass. Check returns its problems, or none. */
export interface TieredSuppressionEstimateRule {
  check(item: TieredSuppressionEstimate): string[];
}

export class TieredSuppressionEstimateRequiredNameRule implements TieredSuppressionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredSuppressionEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredSuppressionEstimateCountryLengthRule implements TieredSuppressionEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredSuppressionEstimate): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredSuppressionEstimateCapacityRangeRule implements TieredSuppressionEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredSuppressionEstimate): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredSuppressionEstimateNameLengthRule implements TieredSuppressionEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredSuppressionEstimate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredSuppressionEstimatePhoneLengthRule implements TieredSuppressionEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredSuppressionEstimate): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered suppression estimate. */
export class TieredSuppressionEstimateValidator {
  rules: TieredSuppressionEstimateRule[];

  constructor(rules: TieredSuppressionEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: TieredSuppressionEstimate): string[] {
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

  requireValid(item: TieredSuppressionEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredSuppressionEstimate[]): Map<string, string[]> {
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

export function defaultTieredSuppressionEstimateValidator(): TieredSuppressionEstimateValidator {
  return new TieredSuppressionEstimateValidator(
    [
      new TieredSuppressionEstimateRequiredNameRule("tiered suppression estimate needs an entry"),
      new TieredSuppressionEstimateCountryLengthRule(64),
      new TieredSuppressionEstimateCapacityRangeRule(1000, 3600),
      new TieredSuppressionEstimateNameLengthRule(80),
      new TieredSuppressionEstimatePhoneLengthRule(1000),
    ],
  );
}
