import * as text from "../../../../kit/text.js";
import { ScheduledNudgeForecast } from "./scheduled-nudge-forecast.js";

/** A rule a scheduled nudge forecast must pass. Check returns its problems, or none. */
export interface ScheduledNudgeForecastRule {
  check(item: ScheduledNudgeForecast): string[];
}

export class ScheduledNudgeForecastThresholdRangeRule implements ScheduledNudgeForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledNudgeForecast): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledNudgeForecastRequiredTitleRule implements ScheduledNudgeForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledNudgeForecast): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledNudgeForecastRequiredPhoneRule implements ScheduledNudgeForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledNudgeForecast): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledNudgeForecastLimitRangeRule implements ScheduledNudgeForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledNudgeForecast): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledNudgeForecastRequiredCodeRule implements ScheduledNudgeForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledNudgeForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledNudgeForecastAllowedPhoneRule implements ScheduledNudgeForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledNudgeForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is above maximum`];
    return [];
  }
}

/** Runs every rule of a scheduled nudge forecast. */
export class ScheduledNudgeForecastValidator {
  rules: ScheduledNudgeForecastRule[];

  constructor(rules: ScheduledNudgeForecastRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledNudgeForecast): string[] {
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

  requireValid(item: ScheduledNudgeForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledNudgeForecast[]): Map<string, string[]> {
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

export function defaultScheduledNudgeForecastValidator(): ScheduledNudgeForecastValidator {
  return new ScheduledNudgeForecastValidator(
    [
      new ScheduledNudgeForecastThresholdRangeRule(9, 1101.4),
      new ScheduledNudgeForecastRequiredTitleRule("scheduled nudge forecast needs an entry"),
      new ScheduledNudgeForecastRequiredPhoneRule("scheduled nudge forecast needs this field"),
      new ScheduledNudgeForecastLimitRangeRule(80, 255),
      new ScheduledNudgeForecastRequiredCodeRule("scheduled nudge forecast needs this field"),
      new ScheduledNudgeForecastAllowedPhoneRule([]),
    ],
  );
}
