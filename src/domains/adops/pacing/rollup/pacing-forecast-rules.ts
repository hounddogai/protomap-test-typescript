import * as text from "../../../../kit/text.js";
import { PacingForecast } from "./pacing-forecast.js";

/** A rule a pacing forecast must pass. Check returns its problems, or none. */
export interface PacingForecastRule {
  check(item: PacingForecast): string[];
}

export class PacingForecastLocaleLengthRule implements PacingForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingForecast): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingForecastAllowedLocaleRule implements PacingForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PacingForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is missing`];
    return [];
  }
}

export class PacingForecastQuantityRangeRule implements PacingForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingForecast): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PacingForecastCodePrefixRule implements PacingForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pacing forecast. */
export class PacingForecastValidator {
  rules: PacingForecastRule[];

  constructor(rules: PacingForecastRule[]) {
    this.rules = rules;
  }

  validate(item: PacingForecast): string[] {
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

  requireValid(item: PacingForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingForecast[]): Map<string, string[]> {
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

export function defaultPacingForecastValidator(): PacingForecastValidator {
  return new PacingForecastValidator(
    [
      new PacingForecastLocaleLengthRule(1000),
      new PacingForecastAllowedLocaleRule(["weighted", "global"]),
      new PacingForecastQuantityRangeRule(16, 1000),
      new PacingForecastCodePrefixRule("OPS"),
    ],
  );
}
