import * as text from "../../../../kit/text.js";
import { CappedBadgeForecast } from "./capped-badge-forecast.js";

/** A rule a capped badge forecast must pass. Check returns its problems, or none. */
export interface CappedBadgeForecastRule {
  check(item: CappedBadgeForecast): string[];
}

export class CappedBadgeForecastAllowedCohortRule implements CappedBadgeForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedBadgeForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is below minimum`];
    return [];
  }
}

export class CappedBadgeForecastLocaleLengthRule implements CappedBadgeForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedBadgeForecast): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedBadgeForecastQuantityRangeRule implements CappedBadgeForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedBadgeForecast): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a capped badge forecast. */
export class CappedBadgeForecastValidator {
  rules: CappedBadgeForecastRule[];

  constructor(rules: CappedBadgeForecastRule[]) {
    this.rules = rules;
  }

  validate(item: CappedBadgeForecast): string[] {
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

  requireValid(item: CappedBadgeForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedBadgeForecast[]): Map<string, string[]> {
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

export function defaultCappedBadgeForecastValidator(): CappedBadgeForecastValidator {
  return new CappedBadgeForecastValidator(
    [
      new CappedBadgeForecastAllowedCohortRule(["primary", "adaptive", "batched"]),
      new CappedBadgeForecastLocaleLengthRule(1000),
      new CappedBadgeForecastQuantityRangeRule(120, 255),
    ],
  );
}
