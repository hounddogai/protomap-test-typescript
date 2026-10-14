import { CohortLedger } from "./cohort-ledger.js";

/** A rule a cohort ledger must pass. Check returns its problems, or none. */
export interface CohortLedgerRule {
  check(item: CohortLedger): string[];
}

export class CohortLedgerSummaryLengthRule implements CohortLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortLedger): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortLedgerCodePrefixRule implements CohortLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CohortLedgerNameLengthRule implements CohortLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortLedger): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortLedgerGraceDaysRangeRule implements CohortLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortLedger): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortLedgerVersionRangeRule implements CohortLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortLedger): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortLedgerSequenceRangeRule implements CohortLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortLedger): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a cohort ledger. */
export class CohortLedgerValidator {
  rules: CohortLedgerRule[];

  constructor(rules: CohortLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: CohortLedger): string[] {
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

  requireValid(item: CohortLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortLedger[]): Map<string, string[]> {
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

export function defaultCohortLedgerValidator(): CohortLedgerValidator {
  return new CohortLedgerValidator(
    [
      new CohortLedgerSummaryLengthRule(64),
      new CohortLedgerCodePrefixRule("OPS"),
      new CohortLedgerNameLengthRule(86400),
      new CohortLedgerGraceDaysRangeRule(16, 64),
      new CohortLedgerVersionRangeRule(32, 80),
      new CohortLedgerSequenceRangeRule(16, 255),
    ],
  );
}
