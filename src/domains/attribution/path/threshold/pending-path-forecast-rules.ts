import { PendingPathForecast } from "./pending-path-forecast.js";

/** A rule a pending path forecast must pass. Check returns its problems, or none. */
export interface PendingPathForecastRule {
  check(item: PendingPathForecast): string[];
}

export class PendingPathForecastRequiredCohortRule implements PendingPathForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPathForecast): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class PendingPathForecastGraceDaysRangeRule implements PendingPathForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingPathForecast): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingPathForecastCodeLengthRule implements PendingPathForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPathForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPathForecastCodePrefixRule implements PendingPathForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingPathForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending path forecast. */
export class PendingPathForecastValidator {
  rules: PendingPathForecastRule[];

  constructor(rules: PendingPathForecastRule[]) {
    this.rules = rules;
  }

  validate(item: PendingPathForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingPathForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingPathForecast[]): Map<string, string[]> {
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

export function defaultPendingPathForecastValidator(): PendingPathForecastValidator {
  return new PendingPathForecastValidator(
    [
      new PendingPathForecastRequiredCohortRule("pending path forecast needs a value"),
      new PendingPathForecastGraceDaysRangeRule(64, 3600),
      new PendingPathForecastCodeLengthRule(3600),
      new PendingPathForecastCodePrefixRule("ACM"),
    ],
  );
}
