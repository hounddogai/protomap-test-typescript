import * as text from "../../../../kit/text.js";
import { PendingMacroBaseline } from "./pending-macro-baseline.js";

/** A rule a pending macro baseline must pass. Check returns its problems, or none. */
export interface PendingMacroBaselineRule {
  check(item: PendingMacroBaseline): string[];
}

export class PendingMacroBaselineAllowedCodeRule implements PendingMacroBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingMacroBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class PendingMacroBaselineCohortLengthRule implements PendingMacroBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingMacroBaseline): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingMacroBaselineRetriesRangeRule implements PendingMacroBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingMacroBaseline): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending macro baseline. */
export class PendingMacroBaselineValidator {
  rules: PendingMacroBaselineRule[];

  constructor(rules: PendingMacroBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: PendingMacroBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingMacroBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingMacroBaseline[]): Map<string, string[]> {
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

export function defaultPendingMacroBaselineValidator(): PendingMacroBaselineValidator {
  return new PendingMacroBaselineValidator(
    [
      new PendingMacroBaselineAllowedCodeRule([]),
      new PendingMacroBaselineCohortLengthRule(3600),
      new PendingMacroBaselineRetriesRangeRule(32, 64),
    ],
  );
}
