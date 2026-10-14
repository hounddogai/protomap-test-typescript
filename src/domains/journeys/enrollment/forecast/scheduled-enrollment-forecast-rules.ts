import * as text from "../../../../kit/text.js";
import { ScheduledEnrollmentForecast } from "./scheduled-enrollment-forecast.js";

/** A rule a scheduled enrollment forecast must pass. Check returns its problems, or none. */
export interface ScheduledEnrollmentForecastRule {
  check(item: ScheduledEnrollmentForecast): string[];
}

export class ScheduledEnrollmentForecastRequiredLabelRule implements ScheduledEnrollmentForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledEnrollmentForecast): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledEnrollmentForecastRequiredExternalRefRule implements ScheduledEnrollmentForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledEnrollmentForecast): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledEnrollmentForecastBudgetRangeRule implements ScheduledEnrollmentForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledEnrollmentForecast): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledEnrollmentForecastCeilingRangeRule implements ScheduledEnrollmentForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledEnrollmentForecast): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledEnrollmentForecastAllowedRegionRule implements ScheduledEnrollmentForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledEnrollmentForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is not allowed`];
    return [];
  }
}

export class ScheduledEnrollmentForecastCodeLengthRule implements ScheduledEnrollmentForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledEnrollmentForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled enrollment forecast. */
export class ScheduledEnrollmentForecastValidator {
  rules: ScheduledEnrollmentForecastRule[];

  constructor(rules: ScheduledEnrollmentForecastRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledEnrollmentForecast): string[] {
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

  requireValid(item: ScheduledEnrollmentForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledEnrollmentForecast[]): Map<string, string[]> {
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

export function defaultScheduledEnrollmentForecastValidator(): ScheduledEnrollmentForecastValidator {
  return new ScheduledEnrollmentForecastValidator(
    [
      new ScheduledEnrollmentForecastRequiredLabelRule("scheduled enrollment forecast needs a value"),
      new ScheduledEnrollmentForecastRequiredExternalRefRule("scheduled enrollment forecast needs a value"),
      new ScheduledEnrollmentForecastBudgetRangeRule(1.9, 3390.7),
      new ScheduledEnrollmentForecastCeilingRangeRule(7.5, 266.8),
      new ScheduledEnrollmentForecastAllowedRegionRule(["batched", "manual"]),
      new ScheduledEnrollmentForecastCodeLengthRule(16),
    ],
  );
}
