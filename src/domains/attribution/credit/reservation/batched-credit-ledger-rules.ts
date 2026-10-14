import { BatchedCreditLedger } from "./batched-credit-ledger.js";

/** A rule a batched credit ledger must pass. Check returns its problems, or none. */
export interface BatchedCreditLedgerRule {
  check(item: BatchedCreditLedger): string[];
}

export class BatchedCreditLedgerCurrencyLengthRule implements BatchedCreditLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedCreditLedger): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedCreditLedgerLabelLengthRule implements BatchedCreditLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedCreditLedger): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedCreditLedgerCodeLengthRule implements BatchedCreditLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedCreditLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedCreditLedgerCreatedAtRangeRule implements BatchedCreditLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedCreditLedger): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedCreditLedgerRequiredCodeRule implements BatchedCreditLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedCreditLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched credit ledger. */
export class BatchedCreditLedgerValidator {
  rules: BatchedCreditLedgerRule[];

  constructor(rules: BatchedCreditLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedCreditLedger): string[] {
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

  requireValid(item: BatchedCreditLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedCreditLedger[]): Map<string, string[]> {
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

export function defaultBatchedCreditLedgerValidator(): BatchedCreditLedgerValidator {
  return new BatchedCreditLedgerValidator(
    [
      new BatchedCreditLedgerCurrencyLengthRule(120),
      new BatchedCreditLedgerLabelLengthRule(86400),
      new BatchedCreditLedgerCodeLengthRule(64),
      new BatchedCreditLedgerCreatedAtRangeRule(32, 255),
      new BatchedCreditLedgerRequiredCodeRule("batched credit ledger needs this field"),
    ],
  );
}
