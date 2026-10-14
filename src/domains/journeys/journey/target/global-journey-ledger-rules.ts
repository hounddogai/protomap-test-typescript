import { GlobalJourneyLedger } from "./global-journey-ledger.js";

/** A rule a global journey ledger must pass. Check returns its problems, or none. */
export interface GlobalJourneyLedgerRule {
  check(item: GlobalJourneyLedger): string[];
}

export class GlobalJourneyLedgerCodePrefixRule implements GlobalJourneyLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalJourneyLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalJourneyLedgerSendAtRangeRule implements GlobalJourneyLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalJourneyLedger): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalJourneyLedgerFrequencyCapRangeRule implements GlobalJourneyLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalJourneyLedger): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a global journey ledger. */
export class GlobalJourneyLedgerValidator {
  rules: GlobalJourneyLedgerRule[];

  constructor(rules: GlobalJourneyLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalJourneyLedger): string[] {
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

  requireValid(item: GlobalJourneyLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalJourneyLedger[]): Map<string, string[]> {
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

export function defaultGlobalJourneyLedgerValidator(): GlobalJourneyLedgerValidator {
  return new GlobalJourneyLedgerValidator(
    [
      new GlobalJourneyLedgerCodePrefixRule("X"),
      new GlobalJourneyLedgerSendAtRangeRule(255, 3600),
      new GlobalJourneyLedgerFrequencyCapRangeRule(1000, 86400),
    ],
  );
}
