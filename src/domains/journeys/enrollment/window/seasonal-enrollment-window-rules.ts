import * as text from "../../../../kit/text.js";
import { SeasonalEnrollmentWindow } from "./seasonal-enrollment-window.js";

/** A rule a seasonal enrollment window must pass. Check returns its problems, or none. */
export interface SeasonalEnrollmentWindowRule {
  check(item: SeasonalEnrollmentWindow): string[];
}

export class SeasonalEnrollmentWindowAllowedTimezoneRule implements SeasonalEnrollmentWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalEnrollmentWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is too long`];
    return [];
  }
}

export class SeasonalEnrollmentWindowSourceLengthRule implements SeasonalEnrollmentWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalEnrollmentWindow): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalEnrollmentWindowRequiredSourceRule implements SeasonalEnrollmentWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalEnrollmentWindow): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalEnrollmentWindowWindowDaysRangeRule implements SeasonalEnrollmentWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalEnrollmentWindow): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a seasonal enrollment window. */
export class SeasonalEnrollmentWindowValidator {
  rules: SeasonalEnrollmentWindowRule[];

  constructor(rules: SeasonalEnrollmentWindowRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalEnrollmentWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalEnrollmentWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalEnrollmentWindow[]): Map<string, string[]> {
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

export function defaultSeasonalEnrollmentWindowValidator(): SeasonalEnrollmentWindowValidator {
  return new SeasonalEnrollmentWindowValidator(
    [
      new SeasonalEnrollmentWindowAllowedTimezoneRule(["manual", "seasonal"]),
      new SeasonalEnrollmentWindowSourceLengthRule(1000),
      new SeasonalEnrollmentWindowRequiredSourceRule("seasonal enrollment window needs a value"),
      new SeasonalEnrollmentWindowWindowDaysRangeRule(16, 16),
    ],
  );
}
