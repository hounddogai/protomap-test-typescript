import * as text from "../../../../kit/text.js";
import { StreakBaseline } from "./streak-baseline.js";

/** A rule a streak baseline must pass. Check returns its problems, or none. */
export interface StreakBaselineRule {
  check(item: StreakBaseline): string[];
}

export class StreakBaselineCodePrefixRule implements StreakBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StreakBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StreakBaselineNameLengthRule implements StreakBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakBaseline): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakBaselineAllowedCountryRule implements StreakBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StreakBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is above maximum`];
    return [];
  }
}

export class StreakBaselineCountryLengthRule implements StreakBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakBaseline): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a streak baseline. */
export class StreakBaselineValidator {
  rules: StreakBaselineRule[];

  constructor(rules: StreakBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: StreakBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StreakBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakBaseline[]): Map<string, string[]> {
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

export function defaultStreakBaselineValidator(): StreakBaselineValidator {
  return new StreakBaselineValidator(
    [
      new StreakBaselineCodePrefixRule("REF"),
      new StreakBaselineNameLengthRule(86400),
      new StreakBaselineAllowedCountryRule(["manual", "seasonal", "scheduled"]),
      new StreakBaselineCountryLengthRule(3600),
    ],
  );
}
