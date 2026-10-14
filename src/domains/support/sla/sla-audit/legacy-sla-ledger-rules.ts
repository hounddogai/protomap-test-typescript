import { LegacySlaLedger } from "./legacy-sla-ledger.js";

/** A rule a legacy sla ledger must pass. Check returns its problems, or none. */
export interface LegacySlaLedgerRule {
  check(item: LegacySlaLedger): string[];
}

export class LegacySlaLedgerActiveGuardRule implements LegacySlaLedgerRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacySlaLedger): string[] {
    if (item.active && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while active`];
    return [];
  }
}

export class LegacySlaLedgerNameLengthRule implements LegacySlaLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySlaLedger): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacySlaLedgerSequenceRangeRule implements LegacySlaLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacySlaLedger): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacySlaLedgerOwnerIdLengthRule implements LegacySlaLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySlaLedger): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacySlaLedgerRequiredLabelRule implements LegacySlaLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacySlaLedger): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacySlaLedgerRequiredCodeRule implements LegacySlaLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacySlaLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy sla ledger. */
export class LegacySlaLedgerValidator {
  rules: LegacySlaLedgerRule[];

  constructor(rules: LegacySlaLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: LegacySlaLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacySlaLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacySlaLedger[]): Map<string, string[]> {
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

export function defaultLegacySlaLedgerValidator(): LegacySlaLedgerValidator {
  return new LegacySlaLedgerValidator(
    [
      new LegacySlaLedgerActiveGuardRule(120),
      new LegacySlaLedgerNameLengthRule(255),
      new LegacySlaLedgerSequenceRangeRule(80, 3600),
      new LegacySlaLedgerOwnerIdLengthRule(80),
      new LegacySlaLedgerRequiredLabelRule("legacy sla ledger needs this field"),
      new LegacySlaLedgerRequiredCodeRule("legacy sla ledger needs an entry"),
    ],
  );
}
