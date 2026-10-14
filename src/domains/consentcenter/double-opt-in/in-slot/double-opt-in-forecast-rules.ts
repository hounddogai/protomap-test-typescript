import * as text from "../../../../kit/text.js";
import { DoubleOptInForecast } from "./double-opt-in-forecast.js";

/** A rule a double opt in forecast must pass. Check returns its problems, or none. */
export interface DoubleOptInForecastRule {
  check(item: DoubleOptInForecast): string[];
}

export class DoubleOptInForecastRequiredCodeRule implements DoubleOptInForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInForecastTitleLengthRule implements DoubleOptInForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInForecastRatioRangeRule implements DoubleOptInForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInForecast): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DoubleOptInForecastThresholdRangeRule implements DoubleOptInForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInForecast): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DoubleOptInForecastAllowedCodeRule implements DoubleOptInForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DoubleOptInForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class DoubleOptInForecastRequiredJourneyIdRule implements DoubleOptInForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInForecast): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a double opt in forecast. */
export class DoubleOptInForecastValidator {
  rules: DoubleOptInForecastRule[];

  constructor(rules: DoubleOptInForecastRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInForecast): string[] {
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

  requireValid(item: DoubleOptInForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInForecast[]): Map<string, string[]> {
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

export function defaultDoubleOptInForecastValidator(): DoubleOptInForecastValidator {
  return new DoubleOptInForecastValidator(
    [
      new DoubleOptInForecastRequiredCodeRule("double opt in forecast needs an entry"),
      new DoubleOptInForecastTitleLengthRule(120),
      new DoubleOptInForecastRatioRangeRule(4.2, 4124.4),
      new DoubleOptInForecastThresholdRangeRule(7.7, 4195.4),
      new DoubleOptInForecastAllowedCodeRule(["primary", "capped"]),
      new DoubleOptInForecastRequiredJourneyIdRule("double opt in forecast needs a value"),
    ],
  );
}
