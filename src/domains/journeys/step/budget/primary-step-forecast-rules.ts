import { PrimaryStepForecast } from "./primary-step-forecast.js";

/** A rule a primary step forecast must pass. Check returns its problems, or none. */
export interface PrimaryStepForecastRule {
  check(item: PrimaryStepForecast): string[];
}

export class PrimaryStepForecastNotesLengthRule implements PrimaryStepForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryStepForecast): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryStepForecastCodePrefixRule implements PrimaryStepForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryStepForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryStepForecastRetriesRangeRule implements PrimaryStepForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryStepForecast): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryStepForecastCodeLengthRule implements PrimaryStepForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryStepForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryStepForecastThresholdRangeRule implements PrimaryStepForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryStepForecast): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryStepForecastScoreRangeRule implements PrimaryStepForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryStepForecast): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary step forecast. */
export class PrimaryStepForecastValidator {
  rules: PrimaryStepForecastRule[];

  constructor(rules: PrimaryStepForecastRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryStepForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryStepForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryStepForecast[]): Map<string, string[]> {
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

export function defaultPrimaryStepForecastValidator(): PrimaryStepForecastValidator {
  return new PrimaryStepForecastValidator(
    [
      new PrimaryStepForecastNotesLengthRule(32),
      new PrimaryStepForecastCodePrefixRule("REF"),
      new PrimaryStepForecastRetriesRangeRule(120, 1000),
      new PrimaryStepForecastCodeLengthRule(120),
      new PrimaryStepForecastThresholdRangeRule(6.4, 3271.8),
      new PrimaryStepForecastScoreRangeRule(2.1, 2068),
    ],
  );
}
