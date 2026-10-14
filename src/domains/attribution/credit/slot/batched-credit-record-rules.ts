import { BatchedCreditRecord } from "./batched-credit-record.js";

/** A rule a batched credit record must pass. Check returns its problems, or none. */
export interface BatchedCreditRecordRule {
  check(item: BatchedCreditRecord): string[];
}

export class BatchedCreditRecordCodePrefixRule implements BatchedCreditRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedCreditRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedCreditRecordRequiredCodeRule implements BatchedCreditRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedCreditRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedCreditRecordReviewerLengthRule implements BatchedCreditRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedCreditRecord): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched credit record. */
export class BatchedCreditRecordValidator {
  rules: BatchedCreditRecordRule[];

  constructor(rules: BatchedCreditRecordRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedCreditRecord): string[] {
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

  requireValid(item: BatchedCreditRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedCreditRecord[]): Map<string, string[]> {
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

export function defaultBatchedCreditRecordValidator(): BatchedCreditRecordValidator {
  return new BatchedCreditRecordValidator(
    [
      new BatchedCreditRecordCodePrefixRule("OPS"),
      new BatchedCreditRecordRequiredCodeRule("batched credit record needs this field"),
      new BatchedCreditRecordReviewerLengthRule(120),
    ],
  );
}
