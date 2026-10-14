import { ComplaintForecast } from "./complaint-forecast.js";

/** A rule a complaint forecast must pass. Check returns its problems, or none. */
export interface ComplaintForecastRule {
  check(item: ComplaintForecast): string[];
}

export class ComplaintForecastDiscountRangeRule implements ComplaintForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintForecast): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ComplaintForecastCodeLengthRule implements ComplaintForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintForecastArchivedGuardRule implements ComplaintForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ComplaintForecast): string[] {
    if (item.archived && item.revision > this.limit) return [`revision ${item.revision} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class ComplaintForecastRevisionRangeRule implements ComplaintForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintForecast): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ComplaintForecastRequiredUnitRule implements ComplaintForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintForecast): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintForecastRequiredCodeRule implements ComplaintForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a complaint forecast. */
export class ComplaintForecastValidator {
  rules: ComplaintForecastRule[];

  constructor(rules: ComplaintForecastRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintForecast): string[] {
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

  requireValid(item: ComplaintForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintForecast[]): Map<string, string[]> {
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

export function defaultComplaintForecastValidator(): ComplaintForecastValidator {
  return new ComplaintForecastValidator(
    [
      new ComplaintForecastDiscountRangeRule(8.1, 3279.4),
      new ComplaintForecastCodeLengthRule(32),
      new ComplaintForecastArchivedGuardRule(1000),
      new ComplaintForecastRevisionRangeRule(80, 1000),
      new ComplaintForecastRequiredUnitRule("complaint forecast needs an entry"),
      new ComplaintForecastRequiredCodeRule("complaint forecast needs this field"),
    ],
  );
}
