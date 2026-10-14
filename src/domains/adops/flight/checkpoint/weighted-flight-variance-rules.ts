import { WeightedFlightVariance } from "./weighted-flight-variance.js";

/** A rule a weighted flight variance must pass. Check returns its problems, or none. */
export interface WeightedFlightVarianceRule {
  check(item: WeightedFlightVariance): string[];
}

export class WeightedFlightVarianceCodeLengthRule implements WeightedFlightVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedFlightVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedFlightVarianceTitleLengthRule implements WeightedFlightVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedFlightVariance): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedFlightVarianceRequiredCodeRule implements WeightedFlightVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedFlightVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedFlightVarianceCategoryLengthRule implements WeightedFlightVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedFlightVariance): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedFlightVarianceRegionLengthRule implements WeightedFlightVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedFlightVariance): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedFlightVarianceScoreRangeRule implements WeightedFlightVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedFlightVariance): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted flight variance. */
export class WeightedFlightVarianceValidator {
  rules: WeightedFlightVarianceRule[];

  constructor(rules: WeightedFlightVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedFlightVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedFlightVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedFlightVariance[]): Map<string, string[]> {
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

export function defaultWeightedFlightVarianceValidator(): WeightedFlightVarianceValidator {
  return new WeightedFlightVarianceValidator(
    [
      new WeightedFlightVarianceCodeLengthRule(255),
      new WeightedFlightVarianceTitleLengthRule(16),
      new WeightedFlightVarianceRequiredCodeRule("weighted flight variance needs a value"),
      new WeightedFlightVarianceCategoryLengthRule(3600),
      new WeightedFlightVarianceRegionLengthRule(86400),
      new WeightedFlightVarianceScoreRangeRule(0.9, 4404),
    ],
  );
}
