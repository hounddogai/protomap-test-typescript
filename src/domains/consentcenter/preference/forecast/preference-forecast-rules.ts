import * as text from "../../../../kit/text.js";
import { PreferenceForecast } from "./preference-forecast.js";

/** A rule a preference forecast must pass. Check returns its problems, or none. */
export interface PreferenceForecastRule {
  check(item: PreferenceForecast): string[];
}

export class PreferenceForecastNameLengthRule implements PreferenceForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceForecast): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceForecastRevisionRangeRule implements PreferenceForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceForecast): string[] {
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

export class PreferenceForecastCreatedAtRangeRule implements PreferenceForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceForecast): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceForecastAllowedCodeRule implements PreferenceForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PreferenceForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

/** Runs every rule of a preference forecast. */
export class PreferenceForecastValidator {
  rules: PreferenceForecastRule[];

  constructor(rules: PreferenceForecastRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceForecast): string[] {
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

  requireValid(item: PreferenceForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceForecast[]): Map<string, string[]> {
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

export function defaultPreferenceForecastValidator(): PreferenceForecastValidator {
  return new PreferenceForecastValidator(
    [
      new PreferenceForecastNameLengthRule(80),
      new PreferenceForecastRevisionRangeRule(255, 3600),
      new PreferenceForecastCreatedAtRangeRule(16, 1000),
      new PreferenceForecastAllowedCodeRule(["adaptive"]),
    ],
  );
}
