import { LegacyDoubleOptInLedger } from "./legacy-double-opt-in-ledger.js";

/** A rule a legacy double opt in ledger must pass. Check returns its problems, or none. */
export interface LegacyDoubleOptInLedgerRule {
  check(item: LegacyDoubleOptInLedger): string[];
}

export class LegacyDoubleOptInLedgerRequiredTitleRule implements LegacyDoubleOptInLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDoubleOptInLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyDoubleOptInLedgerSendAtRangeRule implements LegacyDoubleOptInLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyDoubleOptInLedger): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyDoubleOptInLedgerCodeLengthRule implements LegacyDoubleOptInLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDoubleOptInLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyDoubleOptInLedgerLabelLengthRule implements LegacyDoubleOptInLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDoubleOptInLedger): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyDoubleOptInLedgerRequiredLabelRule implements LegacyDoubleOptInLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDoubleOptInLedger): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyDoubleOptInLedgerRequiredChannelRule implements LegacyDoubleOptInLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDoubleOptInLedger): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy double opt in ledger. */
export class LegacyDoubleOptInLedgerValidator {
  rules: LegacyDoubleOptInLedgerRule[];

  constructor(rules: LegacyDoubleOptInLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyDoubleOptInLedger): string[] {
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

  requireValid(item: LegacyDoubleOptInLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyDoubleOptInLedger[]): Map<string, string[]> {
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

export function defaultLegacyDoubleOptInLedgerValidator(): LegacyDoubleOptInLedgerValidator {
  return new LegacyDoubleOptInLedgerValidator(
    [
      new LegacyDoubleOptInLedgerRequiredTitleRule("legacy double opt in ledger needs a value"),
      new LegacyDoubleOptInLedgerSendAtRangeRule(120, 1000),
      new LegacyDoubleOptInLedgerCodeLengthRule(32),
      new LegacyDoubleOptInLedgerLabelLengthRule(255),
      new LegacyDoubleOptInLedgerRequiredLabelRule("legacy double opt in ledger needs this field"),
      new LegacyDoubleOptInLedgerRequiredChannelRule("legacy double opt in ledger needs an entry"),
    ],
  );
}
