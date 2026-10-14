import { PacingLedger } from "./pacing-ledger.js";

/** A rule a pacing ledger must pass. Check returns its problems, or none. */
export interface PacingLedgerRule {
  check(item: PacingLedger): string[];
}

export class PacingLedgerSourceLengthRule implements PacingLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingLedger): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingLedgerRequiredCodeRule implements PacingLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PacingLedgerLimitRangeRule implements PacingLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingLedger): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PacingLedgerStartsAtRangeRule implements PacingLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingLedger): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PacingLedgerCodePrefixRule implements PacingLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pacing ledger. */
export class PacingLedgerValidator {
  rules: PacingLedgerRule[];

  constructor(rules: PacingLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: PacingLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PacingLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingLedger[]): Map<string, string[]> {
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

export function defaultPacingLedgerValidator(): PacingLedgerValidator {
  return new PacingLedgerValidator(
    [
      new PacingLedgerSourceLengthRule(80),
      new PacingLedgerRequiredCodeRule("pacing ledger needs this field"),
      new PacingLedgerLimitRangeRule(80, 3600),
      new PacingLedgerStartsAtRangeRule(64, 64),
      new PacingLedgerCodePrefixRule("Q"),
    ],
  );
}
