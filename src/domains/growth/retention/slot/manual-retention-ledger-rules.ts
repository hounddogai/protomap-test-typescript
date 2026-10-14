import { ManualRetentionLedger } from "./manual-retention-ledger.js";

/** A rule a manual retention ledger must pass. Check returns its problems, or none. */
export interface ManualRetentionLedgerRule {
  check(item: ManualRetentionLedger): string[];
}

export class ManualRetentionLedgerImpressionsRangeRule implements ManualRetentionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualRetentionLedger): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualRetentionLedgerRequiredReviewerRule implements ManualRetentionLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualRetentionLedger): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class ManualRetentionLedgerRequiredLabelRule implements ManualRetentionLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualRetentionLedger): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ManualRetentionLedgerFloorValueRangeRule implements ManualRetentionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualRetentionLedger): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualRetentionLedgerCodePrefixRule implements ManualRetentionLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualRetentionLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a manual retention ledger. */
export class ManualRetentionLedgerValidator {
  rules: ManualRetentionLedgerRule[];

  constructor(rules: ManualRetentionLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: ManualRetentionLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualRetentionLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualRetentionLedger[]): Map<string, string[]> {
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

export function defaultManualRetentionLedgerValidator(): ManualRetentionLedgerValidator {
  return new ManualRetentionLedgerValidator(
    [
      new ManualRetentionLedgerImpressionsRangeRule(120, 1000),
      new ManualRetentionLedgerRequiredReviewerRule("manual retention ledger needs an entry"),
      new ManualRetentionLedgerRequiredLabelRule("manual retention ledger needs a value"),
      new ManualRetentionLedgerFloorValueRangeRule(1.9, 2356.6),
      new ManualRetentionLedgerCodePrefixRule("Q"),
    ],
  );
}
