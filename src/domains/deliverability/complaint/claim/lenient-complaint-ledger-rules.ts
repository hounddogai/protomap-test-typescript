import { LenientComplaintLedger } from "./lenient-complaint-ledger.js";

/** A rule a lenient complaint ledger must pass. Check returns its problems, or none. */
export interface LenientComplaintLedgerRule {
  check(item: LenientComplaintLedger): string[];
}

export class LenientComplaintLedgerNameLengthRule implements LenientComplaintLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientComplaintLedger): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientComplaintLedgerCodeLengthRule implements LenientComplaintLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientComplaintLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientComplaintLedgerBatchSizeRangeRule implements LenientComplaintLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientComplaintLedger): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient complaint ledger. */
export class LenientComplaintLedgerValidator {
  rules: LenientComplaintLedgerRule[];

  constructor(rules: LenientComplaintLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: LenientComplaintLedger): string[] {
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

  requireValid(item: LenientComplaintLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientComplaintLedger[]): Map<string, string[]> {
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

export function defaultLenientComplaintLedgerValidator(): LenientComplaintLedgerValidator {
  return new LenientComplaintLedgerValidator(
    [
      new LenientComplaintLedgerNameLengthRule(64),
      new LenientComplaintLedgerCodeLengthRule(120),
      new LenientComplaintLedgerBatchSizeRangeRule(1000, 86400),
    ],
  );
}
