import { WeightedBadgeForecast } from "./weighted-badge-forecast.js";

/** A rule a weighted badge forecast must pass. Check returns its problems, or none. */
export interface WeightedBadgeForecastRule {
  check(item: WeightedBadgeForecast): string[];
}

export class WeightedBadgeForecastMinimumRangeRule implements WeightedBadgeForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedBadgeForecast): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedBadgeForecastCodeLengthRule implements WeightedBadgeForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedBadgeForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedBadgeForecastMarginRangeRule implements WeightedBadgeForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedBadgeForecast): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedBadgeForecastCohortLengthRule implements WeightedBadgeForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedBadgeForecast): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted badge forecast. */
export class WeightedBadgeForecastValidator {
  rules: WeightedBadgeForecastRule[];

  constructor(rules: WeightedBadgeForecastRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedBadgeForecast): string[] {
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

  requireValid(item: WeightedBadgeForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedBadgeForecast[]): Map<string, string[]> {
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

export function defaultWeightedBadgeForecastValidator(): WeightedBadgeForecastValidator {
  return new WeightedBadgeForecastValidator(
    [
      new WeightedBadgeForecastMinimumRangeRule(1.9, 4235.1),
      new WeightedBadgeForecastCodeLengthRule(16),
      new WeightedBadgeForecastMarginRangeRule(1.4, 188.9),
      new WeightedBadgeForecastCohortLengthRule(3600),
    ],
  );
}
