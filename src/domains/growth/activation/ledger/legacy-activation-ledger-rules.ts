import { LegacyActivationLedger } from "./legacy-activation-ledger.js";

/** A rule a legacy activation ledger must pass. Check returns its problems, or none. */
export interface LegacyActivationLedgerRule {
  check(item: LegacyActivationLedger): string[];
}

export class LegacyActivationLedgerDescriptionLengthRule implements LegacyActivationLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyActivationLedger): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyActivationLedgerCodeLengthRule implements LegacyActivationLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyActivationLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyActivationLedgerTitleLengthRule implements LegacyActivationLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyActivationLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyActivationLedgerBatchSizeRangeRule implements LegacyActivationLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyActivationLedger): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy activation ledger. */
export class LegacyActivationLedgerValidator {
  rules: LegacyActivationLedgerRule[];

  constructor(rules: LegacyActivationLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyActivationLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyActivationLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyActivationLedger[]): Map<string, string[]> {
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

export function defaultLegacyActivationLedgerValidator(): LegacyActivationLedgerValidator {
  return new LegacyActivationLedgerValidator(
    [
      new LegacyActivationLedgerDescriptionLengthRule(32),
      new LegacyActivationLedgerCodeLengthRule(32),
      new LegacyActivationLedgerTitleLengthRule(32),
      new LegacyActivationLedgerBatchSizeRangeRule(120, 255),
    ],
  );
}
