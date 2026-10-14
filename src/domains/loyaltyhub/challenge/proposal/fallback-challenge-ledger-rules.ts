import * as text from "../../../../kit/text.js";
import { FallbackChallengeLedger } from "./fallback-challenge-ledger.js";

/** A rule a fallback challenge ledger must pass. Check returns its problems, or none. */
export interface FallbackChallengeLedgerRule {
  check(item: FallbackChallengeLedger): string[];
}

export class FallbackChallengeLedgerEndsAtRangeRule implements FallbackChallengeLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackChallengeLedger): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackChallengeLedgerNameLengthRule implements FallbackChallengeLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackChallengeLedger): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackChallengeLedgerAllowedNameRule implements FallbackChallengeLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackChallengeLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is not allowed`];
    return [];
  }
}

export class FallbackChallengeLedgerRequiredNameRule implements FallbackChallengeLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackChallengeLedger): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackChallengeLedgerConversionRateRangeRule implements FallbackChallengeLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackChallengeLedger): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackChallengeLedgerCountryLengthRule implements FallbackChallengeLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackChallengeLedger): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback challenge ledger. */
export class FallbackChallengeLedgerValidator {
  rules: FallbackChallengeLedgerRule[];

  constructor(rules: FallbackChallengeLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackChallengeLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackChallengeLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackChallengeLedger[]): Map<string, string[]> {
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

export function defaultFallbackChallengeLedgerValidator(): FallbackChallengeLedgerValidator {
  return new FallbackChallengeLedgerValidator(
    [
      new FallbackChallengeLedgerEndsAtRangeRule(32, 120),
      new FallbackChallengeLedgerNameLengthRule(120),
      new FallbackChallengeLedgerAllowedNameRule(["fallback", "regional"]),
      new FallbackChallengeLedgerRequiredNameRule("fallback challenge ledger needs this field"),
      new FallbackChallengeLedgerConversionRateRangeRule(1.3, 4930),
      new FallbackChallengeLedgerCountryLengthRule(3600),
    ],
  );
}
