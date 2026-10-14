import { ScheduledPathForecast } from "./scheduled-path-forecast.js";

/** A rule a scheduled path forecast must pass. Check returns its problems, or none. */
export interface ScheduledPathForecastRule {
  check(item: ScheduledPathForecast): string[];
}

export class ScheduledPathForecastRequiredSourceRule implements ScheduledPathForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPathForecast): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPathForecastCodeLengthRule implements ScheduledPathForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPathForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPathForecastSourceLengthRule implements ScheduledPathForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPathForecast): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPathForecastRequiredSegmentRule implements ScheduledPathForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPathForecast): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled path forecast. */
export class ScheduledPathForecastValidator {
  rules: ScheduledPathForecastRule[];

  constructor(rules: ScheduledPathForecastRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPathForecast): string[] {
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

  requireValid(item: ScheduledPathForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPathForecast[]): Map<string, string[]> {
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

export function defaultScheduledPathForecastValidator(): ScheduledPathForecastValidator {
  return new ScheduledPathForecastValidator(
    [
      new ScheduledPathForecastRequiredSourceRule("scheduled path forecast needs a value"),
      new ScheduledPathForecastCodeLengthRule(80),
      new ScheduledPathForecastSourceLengthRule(64),
      new ScheduledPathForecastRequiredSegmentRule("scheduled path forecast needs a value"),
    ],
  );
}
