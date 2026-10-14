import * as text from "../../../../kit/text.js";
import { TierForecast } from "./tier-forecast.js";

/** A rule a tier forecast must pass. Check returns its problems, or none. */
export interface TierForecastRule {
  check(item: TierForecast): string[];
}

export class TierForecastCreatedAtRangeRule implements TierForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierForecast): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TierForecastAllowedCodeRule implements TierForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TierForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class TierForecastRequiredLabelRule implements TierForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierForecast): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TierForecastRetriesRangeRule implements TierForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierForecast): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tier forecast. */
export class TierForecastValidator {
  rules: TierForecastRule[];

  constructor(rules: TierForecastRule[]) {
    this.rules = rules;
  }

  validate(item: TierForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierForecast[]): Map<string, string[]> {
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

export function defaultTierForecastValidator(): TierForecastValidator {
  return new TierForecastValidator(
    [
      new TierForecastCreatedAtRangeRule(64, 80),
      new TierForecastAllowedCodeRule(["primary"]),
      new TierForecastRequiredLabelRule("tier forecast needs an entry"),
      new TierForecastRetriesRangeRule(32, 1000),
    ],
  );
}
