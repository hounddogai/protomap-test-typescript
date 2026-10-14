import { CohortWindow } from "./cohort-window.js";

/** A rule a cohort window must pass. Check returns its problems, or none. */
export interface CohortWindowRule {
  check(item: CohortWindow): string[];
}

export class CohortWindowBidRangeRule implements CohortWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortWindow): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortWindowCreatedAtRangeRule implements CohortWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortWindow): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortWindowRequiredCountryRule implements CohortWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortWindow): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class CohortWindowExpiresAtRangeRule implements CohortWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortWindow): string[] {
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

export class CohortWindowCodePrefixRule implements CohortWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CohortWindowCountryLengthRule implements CohortWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortWindow): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a cohort window. */
export class CohortWindowValidator {
  rules: CohortWindowRule[];

  constructor(rules: CohortWindowRule[]) {
    this.rules = rules;
  }

  validate(item: CohortWindow): string[] {
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

  requireValid(item: CohortWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortWindow[]): Map<string, string[]> {
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

export function defaultCohortWindowValidator(): CohortWindowValidator {
  return new CohortWindowValidator(
    [
      new CohortWindowBidRangeRule(5.7, 1277),
      new CohortWindowCreatedAtRangeRule(32, 32),
      new CohortWindowRequiredCountryRule("cohort window needs a value"),
      new CohortWindowExpiresAtRangeRule(16, 32),
      new CohortWindowCodePrefixRule("Q"),
      new CohortWindowCountryLengthRule(64),
    ],
  );
}
