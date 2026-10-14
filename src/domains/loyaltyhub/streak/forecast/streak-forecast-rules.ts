import * as text from "../../../../kit/text.js";
import { StreakForecast } from "./streak-forecast.js";

/** A rule a streak forecast must pass. Check returns its problems, or none. */
export interface StreakForecastRule {
  check(item: StreakForecast): string[];
}

export class StreakForecastBudgetRangeRule implements StreakForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakForecast): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StreakForecastTitleLengthRule implements StreakForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakForecastRequiredTitleRule implements StreakForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakForecast): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StreakForecastAllowedCodeRule implements StreakForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StreakForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class StreakForecastExpiresAtRangeRule implements StreakForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakForecast): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StreakForecastRequiredCodeRule implements StreakForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a streak forecast. */
export class StreakForecastValidator {
  rules: StreakForecastRule[];

  constructor(rules: StreakForecastRule[]) {
    this.rules = rules;
  }

  validate(item: StreakForecast): string[] {
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

  requireValid(item: StreakForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakForecast[]): Map<string, string[]> {
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

export function defaultStreakForecastValidator(): StreakForecastValidator {
  return new StreakForecastValidator(
    [
      new StreakForecastBudgetRangeRule(9, 2135.6),
      new StreakForecastTitleLengthRule(255),
      new StreakForecastRequiredTitleRule("streak forecast needs an entry"),
      new StreakForecastAllowedCodeRule(["seasonal", "regional"]),
      new StreakForecastExpiresAtRangeRule(64, 255),
      new StreakForecastRequiredCodeRule("streak forecast needs a value"),
    ],
  );
}
