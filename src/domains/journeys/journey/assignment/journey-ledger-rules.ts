import * as text from "../../../../kit/text.js";
import { JourneyLedger } from "./journey-ledger.js";

/** A rule a journey ledger must pass. Check returns its problems, or none. */
export interface JourneyLedgerRule {
  check(item: JourneyLedger): string[];
}

export class JourneyLedgerRequiredNotesRule implements JourneyLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyLedger): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyLedgerAllowedCodeRule implements JourneyLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: JourneyLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class JourneyLedgerRequiredVariantRule implements JourneyLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyLedger): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyLedgerMaximumRangeRule implements JourneyLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyLedger): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class JourneyLedgerRetriesRangeRule implements JourneyLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyLedger): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class JourneyLedgerTitleLengthRule implements JourneyLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a journey ledger. */
export class JourneyLedgerValidator {
  rules: JourneyLedgerRule[];

  constructor(rules: JourneyLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyLedger[]): Map<string, string[]> {
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

export function defaultJourneyLedgerValidator(): JourneyLedgerValidator {
  return new JourneyLedgerValidator(
    [
      new JourneyLedgerRequiredNotesRule("journey ledger needs an entry"),
      new JourneyLedgerAllowedCodeRule(["manual", "tiered", "fallback"]),
      new JourneyLedgerRequiredVariantRule("journey ledger needs this field"),
      new JourneyLedgerMaximumRangeRule(7.9, 4075.7),
      new JourneyLedgerRetriesRangeRule(80, 1000),
      new JourneyLedgerTitleLengthRule(86400),
    ],
  );
}
