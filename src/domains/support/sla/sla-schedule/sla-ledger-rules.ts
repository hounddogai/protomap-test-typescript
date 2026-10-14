import { SlaLedger } from "./sla-ledger.js";

/** A rule a sla ledger must pass. Check returns its problems, or none. */
export interface SlaLedgerRule {
  check(item: SlaLedger): string[];
}

export class SlaLedgerRetriesRangeRule implements SlaLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaLedger): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SlaLedgerRequiredCodeRule implements SlaLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SlaLedgerRequiredSummaryRule implements SlaLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaLedger): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class SlaLedgerCodeLengthRule implements SlaLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaLedgerRequiredLabelRule implements SlaLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaLedger): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a sla ledger. */
export class SlaLedgerValidator {
  rules: SlaLedgerRule[];

  constructor(rules: SlaLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: SlaLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaLedger[]): Map<string, string[]> {
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

export function defaultSlaLedgerValidator(): SlaLedgerValidator {
  return new SlaLedgerValidator(
    [
      new SlaLedgerRetriesRangeRule(1000, 86400),
      new SlaLedgerRequiredCodeRule("sla ledger needs a value"),
      new SlaLedgerRequiredSummaryRule("sla ledger needs this field"),
      new SlaLedgerCodeLengthRule(120),
      new SlaLedgerRequiredLabelRule("sla ledger needs an entry"),
    ],
  );
}
