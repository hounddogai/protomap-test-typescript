import * as text from "../../../../kit/text.js";
import { PacingEntry } from "./pacing-entry.js";

/** A rule a pacing entry must pass. Check returns its problems, or none. */
export interface PacingEntryRule {
  check(item: PacingEntry): string[];
}

export class PacingEntryAllowedCohortRule implements PacingEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PacingEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is missing`];
    return [];
  }
}

export class PacingEntryLocaleLengthRule implements PacingEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingEntry): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingEntryClicksRangeRule implements PacingEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingEntry): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PacingEntryRequiredLocaleRule implements PacingEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingEntry): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PacingEntryRequiredCodeRule implements PacingEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pacing entry. */
export class PacingEntryValidator {
  rules: PacingEntryRule[];

  constructor(rules: PacingEntryRule[]) {
    this.rules = rules;
  }

  validate(item: PacingEntry): string[] {
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

  requireValid(item: PacingEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingEntry[]): Map<string, string[]> {
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

export function defaultPacingEntryValidator(): PacingEntryValidator {
  return new PacingEntryValidator(
    [
      new PacingEntryAllowedCohortRule(["pending"]),
      new PacingEntryLocaleLengthRule(64),
      new PacingEntryClicksRangeRule(1000, 1000),
      new PacingEntryRequiredLocaleRule("pacing entry needs this field"),
      new PacingEntryRequiredCodeRule("pacing entry needs this field"),
    ],
  );
}
