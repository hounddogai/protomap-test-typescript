import { CreditForecast } from "./credit-forecast.js";

/** A rule a credit forecast must pass. Check returns its problems, or none. */
export interface CreditForecastRule {
  check(item: CreditForecast): string[];
}

export class CreditForecastStartsAtRangeRule implements CreditForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditForecast): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditForecastRevisionRangeRule implements CreditForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditForecast): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreditForecastCodeLengthRule implements CreditForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a credit forecast. */
export class CreditForecastValidator {
  rules: CreditForecastRule[];

  constructor(rules: CreditForecastRule[]) {
    this.rules = rules;
  }

  validate(item: CreditForecast): string[] {
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

  requireValid(item: CreditForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditForecast[]): Map<string, string[]> {
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

export function defaultCreditForecastValidator(): CreditForecastValidator {
  return new CreditForecastValidator(
    [
      new CreditForecastStartsAtRangeRule(120, 1000),
      new CreditForecastRevisionRangeRule(16, 120),
      new CreditForecastCodeLengthRule(1000),
    ],
  );
}
