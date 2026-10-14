import * as text from "../../../../kit/text.js";
import { CohortProfile } from "./cohort-profile.js";

/** A rule a cohort profile must pass. Check returns its problems, or none. */
export interface CohortProfileRule {
  check(item: CohortProfile): string[];
}

export class CohortProfileRequiredCodeRule implements CohortProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CohortProfileCodeLengthRule implements CohortProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortProfileCeilingRangeRule implements CohortProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortProfile): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortProfileAllowedTimezoneRule implements CohortProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CohortProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is expired`];
    return [];
  }
}

export class CohortProfileRequiredTitleRule implements CohortProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortProfile): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CohortProfileDurationMinutesRangeRule implements CohortProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortProfile): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a cohort profile. */
export class CohortProfileValidator {
  rules: CohortProfileRule[];

  constructor(rules: CohortProfileRule[]) {
    this.rules = rules;
  }

  validate(item: CohortProfile): string[] {
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

  requireValid(item: CohortProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortProfile[]): Map<string, string[]> {
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

export function defaultCohortProfileValidator(): CohortProfileValidator {
  return new CohortProfileValidator(
    [
      new CohortProfileRequiredCodeRule("cohort profile needs this field"),
      new CohortProfileCodeLengthRule(1000),
      new CohortProfileCeilingRangeRule(6.3, 1732.5),
      new CohortProfileAllowedTimezoneRule(["weighted"]),
      new CohortProfileRequiredTitleRule("cohort profile needs a value"),
      new CohortProfileDurationMinutesRangeRule(64, 64),
    ],
  );
}
