import { StrictCohortBaseline } from "./strict-cohort-baseline.js";

/** A rule a strict cohort baseline must pass. Check returns its problems, or none. */
export interface StrictCohortBaselineRule {
  check(item: StrictCohortBaseline): string[];
}

export class StrictCohortBaselineRequiredCodeRule implements StrictCohortBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCohortBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictCohortBaselineRequiredSourceRule implements StrictCohortBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCohortBaseline): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class StrictCohortBaselineCodePrefixRule implements StrictCohortBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictCohortBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictCohortBaselineGraceDaysRangeRule implements StrictCohortBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictCohortBaseline): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictCohortBaselineSourceLengthRule implements StrictCohortBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCohortBaseline): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictCohortBaselineBidRangeRule implements StrictCohortBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictCohortBaseline): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict cohort baseline. */
export class StrictCohortBaselineValidator {
  rules: StrictCohortBaselineRule[];

  constructor(rules: StrictCohortBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: StrictCohortBaseline): string[] {
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

  requireValid(item: StrictCohortBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictCohortBaseline[]): Map<string, string[]> {
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

export function defaultStrictCohortBaselineValidator(): StrictCohortBaselineValidator {
  return new StrictCohortBaselineValidator(
    [
      new StrictCohortBaselineRequiredCodeRule("strict cohort baseline needs this field"),
      new StrictCohortBaselineRequiredSourceRule("strict cohort baseline needs a value"),
      new StrictCohortBaselineCodePrefixRule("REF"),
      new StrictCohortBaselineGraceDaysRangeRule(16, 32),
      new StrictCohortBaselineSourceLengthRule(3600),
      new StrictCohortBaselineBidRangeRule(5.6, 2870.2),
    ],
  );
}
