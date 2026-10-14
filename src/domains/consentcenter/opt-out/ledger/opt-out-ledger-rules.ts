import { OptOutLedger } from "./opt-out-ledger.js";

/** A rule a opt out ledger must pass. Check returns its problems, or none. */
export interface OptOutLedgerRule {
  check(item: OptOutLedger): string[];
}

export class OptOutLedgerSegmentLengthRule implements OptOutLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutLedger): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutLedgerRequiredSegmentRule implements OptOutLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutLedger): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutLedgerCodeLengthRule implements OptOutLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutLedgerBatchSizeRangeRule implements OptOutLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutLedger): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a opt out ledger. */
export class OptOutLedgerValidator {
  rules: OptOutLedgerRule[];

  constructor(rules: OptOutLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: OptOutLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutLedger[]): Map<string, string[]> {
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

export function defaultOptOutLedgerValidator(): OptOutLedgerValidator {
  return new OptOutLedgerValidator(
    [
      new OptOutLedgerSegmentLengthRule(86400),
      new OptOutLedgerRequiredSegmentRule("opt out ledger needs an entry"),
      new OptOutLedgerCodeLengthRule(16),
      new OptOutLedgerBatchSizeRangeRule(255, 1000),
    ],
  );
}
