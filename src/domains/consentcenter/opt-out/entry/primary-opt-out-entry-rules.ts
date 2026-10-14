import * as text from "../../../../kit/text.js";
import { PrimaryOptOutEntry } from "./primary-opt-out-entry.js";

/** A rule a primary opt out entry must pass. Check returns its problems, or none. */
export interface PrimaryOptOutEntryRule {
  check(item: PrimaryOptOutEntry): string[];
}

export class PrimaryOptOutEntryRequiredCurrencyRule implements PrimaryOptOutEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryOptOutEntry): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryOptOutEntryAllowedCohortRule implements PrimaryOptOutEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryOptOutEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is missing`];
    return [];
  }
}

export class PrimaryOptOutEntryCurrencyLengthRule implements PrimaryOptOutEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryOptOutEntry): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary opt out entry. */
export class PrimaryOptOutEntryValidator {
  rules: PrimaryOptOutEntryRule[];

  constructor(rules: PrimaryOptOutEntryRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryOptOutEntry): string[] {
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

  requireValid(item: PrimaryOptOutEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryOptOutEntry[]): Map<string, string[]> {
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

export function defaultPrimaryOptOutEntryValidator(): PrimaryOptOutEntryValidator {
  return new PrimaryOptOutEntryValidator(
    [
      new PrimaryOptOutEntryRequiredCurrencyRule("primary opt out entry needs this field"),
      new PrimaryOptOutEntryAllowedCohortRule(["legacy", "batched", "weighted"]),
      new PrimaryOptOutEntryCurrencyLengthRule(1000),
    ],
  );
}
