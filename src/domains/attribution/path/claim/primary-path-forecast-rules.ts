import * as text from "../../../../kit/text.js";
import { PrimaryPathForecast } from "./primary-path-forecast.js";

/** A rule a primary path forecast must pass. Check returns its problems, or none. */
export interface PrimaryPathForecastRule {
  check(item: PrimaryPathForecast): string[];
}

export class PrimaryPathForecastPriorityRangeRule implements PrimaryPathForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPathForecast): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryPathForecastCountryLengthRule implements PrimaryPathForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPathForecast): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPathForecastTitleLengthRule implements PrimaryPathForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPathForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPathForecastAllowedCodeRule implements PrimaryPathForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryPathForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class PrimaryPathForecastCreatedAtRangeRule implements PrimaryPathForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPathForecast): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryPathForecastSequenceRangeRule implements PrimaryPathForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPathForecast): string[] {
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

/** Runs every rule of a primary path forecast. */
export class PrimaryPathForecastValidator {
  rules: PrimaryPathForecastRule[];

  constructor(rules: PrimaryPathForecastRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPathForecast): string[] {
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

  requireValid(item: PrimaryPathForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPathForecast[]): Map<string, string[]> {
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

export function defaultPrimaryPathForecastValidator(): PrimaryPathForecastValidator {
  return new PrimaryPathForecastValidator(
    [
      new PrimaryPathForecastPriorityRangeRule(16, 80),
      new PrimaryPathForecastCountryLengthRule(64),
      new PrimaryPathForecastTitleLengthRule(32),
      new PrimaryPathForecastAllowedCodeRule(["tiered", "strict", "seasonal"]),
      new PrimaryPathForecastCreatedAtRangeRule(32, 255),
      new PrimaryPathForecastSequenceRangeRule(86400, 86400),
    ],
  );
}
