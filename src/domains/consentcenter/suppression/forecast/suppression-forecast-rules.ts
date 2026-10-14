import { SuppressionForecast } from "./suppression-forecast.js";

/** A rule a suppression forecast must pass. Check returns its problems, or none. */
export interface SuppressionForecastRule {
  check(item: SuppressionForecast): string[];
}

export class SuppressionForecastRequiredCategoryRule implements SuppressionForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionForecast): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionForecastSequenceRangeRule implements SuppressionForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionForecast): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SuppressionForecastReviewerLengthRule implements SuppressionForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionForecast): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionForecastRequiredTitleRule implements SuppressionForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionForecast): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionForecastRatioRangeRule implements SuppressionForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionForecast): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SuppressionForecastCategoryLengthRule implements SuppressionForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionForecast): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a suppression forecast. */
export class SuppressionForecastValidator {
  rules: SuppressionForecastRule[];

  constructor(rules: SuppressionForecastRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionForecast[]): Map<string, string[]> {
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

export function defaultSuppressionForecastValidator(): SuppressionForecastValidator {
  return new SuppressionForecastValidator(
    [
      new SuppressionForecastRequiredCategoryRule("suppression forecast needs an entry"),
      new SuppressionForecastSequenceRangeRule(32, 3600),
      new SuppressionForecastReviewerLengthRule(64),
      new SuppressionForecastRequiredTitleRule("suppression forecast needs a value"),
      new SuppressionForecastRatioRangeRule(1.4, 2187.1),
      new SuppressionForecastCategoryLengthRule(32),
    ],
  );
}
