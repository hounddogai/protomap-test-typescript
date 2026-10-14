import { StrictQueueLedger } from "./strict-queue-ledger.js";

/** A rule a strict queue ledger must pass. Check returns its problems, or none. */
export interface StrictQueueLedgerRule {
  check(item: StrictQueueLedger): string[];
}

export class StrictQueueLedgerRequiredCodeRule implements StrictQueueLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictQueueLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictQueueLedgerQuantityRangeRule implements StrictQueueLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictQueueLedger): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictQueueLedgerCodePrefixRule implements StrictQueueLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictQueueLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict queue ledger. */
export class StrictQueueLedgerValidator {
  rules: StrictQueueLedgerRule[];

  constructor(rules: StrictQueueLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: StrictQueueLedger): string[] {
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

  requireValid(item: StrictQueueLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictQueueLedger[]): Map<string, string[]> {
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

export function defaultStrictQueueLedgerValidator(): StrictQueueLedgerValidator {
  return new StrictQueueLedgerValidator(
    [
      new StrictQueueLedgerRequiredCodeRule("strict queue ledger needs this field"),
      new StrictQueueLedgerQuantityRangeRule(16, 86400),
      new StrictQueueLedgerCodePrefixRule("REF"),
    ],
  );
}
