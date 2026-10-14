import { PrimaryQueueForecast } from "./primary-queue-forecast.js";

/** A rule a primary queue forecast must pass. Check returns its problems, or none. */
export interface PrimaryQueueForecastRule {
  check(item: PrimaryQueueForecast): string[];
}

export class PrimaryQueueForecastLocaleLengthRule implements PrimaryQueueForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryQueueForecast): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryQueueForecastTitleLengthRule implements PrimaryQueueForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryQueueForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryQueueForecastRequiredCodeRule implements PrimaryQueueForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryQueueForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryQueueForecastCohortLengthRule implements PrimaryQueueForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryQueueForecast): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryQueueForecastStartsAtRangeRule implements PrimaryQueueForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryQueueForecast): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryQueueForecastRequiredTitleRule implements PrimaryQueueForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryQueueForecast): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary queue forecast. */
export class PrimaryQueueForecastValidator {
  rules: PrimaryQueueForecastRule[];

  constructor(rules: PrimaryQueueForecastRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryQueueForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryQueueForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryQueueForecast[]): Map<string, string[]> {
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

export function defaultPrimaryQueueForecastValidator(): PrimaryQueueForecastValidator {
  return new PrimaryQueueForecastValidator(
    [
      new PrimaryQueueForecastLocaleLengthRule(86400),
      new PrimaryQueueForecastTitleLengthRule(64),
      new PrimaryQueueForecastRequiredCodeRule("primary queue forecast needs an entry"),
      new PrimaryQueueForecastCohortLengthRule(80),
      new PrimaryQueueForecastStartsAtRangeRule(80, 120),
      new PrimaryQueueForecastRequiredTitleRule("primary queue forecast needs an entry"),
    ],
  );
}
