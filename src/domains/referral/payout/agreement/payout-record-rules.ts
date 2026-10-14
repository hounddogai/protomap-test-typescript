import * as text from "../../../../kit/text.js";
import { PayoutRecord } from "./payout-record.js";

/** A rule a payout record must pass. Check returns its problems, or none. */
export interface PayoutRecordRule {
  check(item: PayoutRecord): string[];
}

export class PayoutRecordCodeLengthRule implements PayoutRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutRecordRequiredCodeRule implements PayoutRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutRecordAllowedTimezoneRule implements PayoutRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PayoutRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is unknown`];
    return [];
  }
}

/** Runs every rule of a payout record. */
export class PayoutRecordValidator {
  rules: PayoutRecordRule[];

  constructor(rules: PayoutRecordRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PayoutRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutRecord[]): Map<string, string[]> {
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

export function defaultPayoutRecordValidator(): PayoutRecordValidator {
  return new PayoutRecordValidator(
    [
      new PayoutRecordCodeLengthRule(1000),
      new PayoutRecordRequiredCodeRule("payout record needs this field"),
      new PayoutRecordAllowedTimezoneRule(["seasonal", "batched"]),
    ],
  );
}
