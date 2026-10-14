import { PrimaryInsightLedger } from "./primary-insight-ledger.js";

/** A rule a primary insight ledger must pass. Check returns its problems, or none. */
export interface PrimaryInsightLedgerRule {
  check(item: PrimaryInsightLedger): string[];
}

export class PrimaryInsightLedgerCodeLengthRule implements PrimaryInsightLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryInsightLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryInsightLedgerRequiredCodeRule implements PrimaryInsightLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryInsightLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryInsightLedgerRequiredNameRule implements PrimaryInsightLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryInsightLedger): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryInsightLedgerNameLengthRule implements PrimaryInsightLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryInsightLedger): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryInsightLedgerDescriptionLengthRule implements PrimaryInsightLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryInsightLedger): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryInsightLedgerEndsAtRangeRule implements PrimaryInsightLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryInsightLedger): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary insight ledger. */
export class PrimaryInsightLedgerValidator {
  rules: PrimaryInsightLedgerRule[];

  constructor(rules: PrimaryInsightLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryInsightLedger): string[] {
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

  requireValid(item: PrimaryInsightLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryInsightLedger[]): Map<string, string[]> {
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

export function defaultPrimaryInsightLedgerValidator(): PrimaryInsightLedgerValidator {
  return new PrimaryInsightLedgerValidator(
    [
      new PrimaryInsightLedgerCodeLengthRule(120),
      new PrimaryInsightLedgerRequiredCodeRule("primary insight ledger needs this field"),
      new PrimaryInsightLedgerRequiredNameRule("primary insight ledger needs this field"),
      new PrimaryInsightLedgerNameLengthRule(80),
      new PrimaryInsightLedgerDescriptionLengthRule(3600),
      new PrimaryInsightLedgerEndsAtRangeRule(80, 255),
    ],
  );
}
