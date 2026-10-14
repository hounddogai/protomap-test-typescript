import { SenderLedger } from "./sender-ledger.js";

/** A rule a sender ledger must pass. Check returns its problems, or none. */
export interface SenderLedgerRule {
  check(item: SenderLedger): string[];
}

export class SenderLedgerOpenRateRangeRule implements SenderLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderLedger): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SenderLedgerSummaryLengthRule implements SenderLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderLedger): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderLedgerRequiredSummaryRule implements SenderLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderLedger): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class SenderLedgerPhoneLengthRule implements SenderLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderLedger): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderLedgerBudgetRangeRule implements SenderLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderLedger): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a sender ledger. */
export class SenderLedgerValidator {
  rules: SenderLedgerRule[];

  constructor(rules: SenderLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: SenderLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderLedger[]): Map<string, string[]> {
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

export function defaultSenderLedgerValidator(): SenderLedgerValidator {
  return new SenderLedgerValidator(
    [
      new SenderLedgerOpenRateRangeRule(1.3, 2887.6),
      new SenderLedgerSummaryLengthRule(80),
      new SenderLedgerRequiredSummaryRule("sender ledger needs a value"),
      new SenderLedgerPhoneLengthRule(64),
      new SenderLedgerBudgetRangeRule(5.8, 670.7),
    ],
  );
}
