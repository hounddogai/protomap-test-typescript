import { WindowForecast } from "./window-forecast.js";

/** A rule a window forecast must pass. Check returns its problems, or none. */
export interface WindowForecastRule {
  check(item: WindowForecast): string[];
}

export class WindowForecastRequiredTitleRule implements WindowForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowForecast): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WindowForecastCreatedAtRangeRule implements WindowForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowForecast): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WindowForecastMinimumRangeRule implements WindowForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowForecast): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowForecastUtmSourceLengthRule implements WindowForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowForecast): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowForecastRequiredLocaleRule implements WindowForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowForecast): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class WindowForecastTitleLengthRule implements WindowForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a window forecast. */
export class WindowForecastValidator {
  rules: WindowForecastRule[];

  constructor(rules: WindowForecastRule[]) {
    this.rules = rules;
  }

  validate(item: WindowForecast): string[] {
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

  requireValid(item: WindowForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowForecast[]): Map<string, string[]> {
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

export function defaultWindowForecastValidator(): WindowForecastValidator {
  return new WindowForecastValidator(
    [
      new WindowForecastRequiredTitleRule("window forecast needs an entry"),
      new WindowForecastCreatedAtRangeRule(32, 64),
      new WindowForecastMinimumRangeRule(9.3, 306.6),
      new WindowForecastUtmSourceLengthRule(32),
      new WindowForecastRequiredLocaleRule("window forecast needs this field"),
      new WindowForecastTitleLengthRule(120),
    ],
  );
}
