import * as text from "../../../../kit/text.js";
import { InsightForecast } from "./insight-forecast.js";

/** A rule a insight forecast must pass. Check returns its problems, or none. */
export interface InsightForecastRule {
  check(item: InsightForecast): string[];
}

export class InsightForecastLabelLengthRule implements InsightForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightForecast): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightForecastBudgetRangeRule implements InsightForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightForecast): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InsightForecastCodeLengthRule implements InsightForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightForecastAllowedNameRule implements InsightForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InsightForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

/** Runs every rule of a insight forecast. */
export class InsightForecastValidator {
  rules: InsightForecastRule[];

  constructor(rules: InsightForecastRule[]) {
    this.rules = rules;
  }

  validate(item: InsightForecast): string[] {
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

  requireValid(item: InsightForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightForecast[]): Map<string, string[]> {
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

export function defaultInsightForecastValidator(): InsightForecastValidator {
  return new InsightForecastValidator(
    [
      new InsightForecastLabelLengthRule(64),
      new InsightForecastBudgetRangeRule(4.5, 3252),
      new InsightForecastCodeLengthRule(32),
      new InsightForecastAllowedNameRule(["regional", "scheduled"]),
    ],
  );
}
