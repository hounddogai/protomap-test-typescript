import { TieredPaywallLedger } from "./tiered-paywall-ledger.js";

/** A rule a tiered paywall ledger must pass. Check returns its problems, or none. */
export interface TieredPaywallLedgerRule {
  check(item: TieredPaywallLedger): string[];
}

export class TieredPaywallLedgerRequiredNameRule implements TieredPaywallLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPaywallLedger): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPaywallLedgerRevisionRangeRule implements TieredPaywallLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPaywallLedger): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredPaywallLedgerCodePrefixRule implements TieredPaywallLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredPaywallLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredPaywallLedgerRequiredJourneyIdRule implements TieredPaywallLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPaywallLedger): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered paywall ledger. */
export class TieredPaywallLedgerValidator {
  rules: TieredPaywallLedgerRule[];

  constructor(rules: TieredPaywallLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPaywallLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredPaywallLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPaywallLedger[]): Map<string, string[]> {
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

export function defaultTieredPaywallLedgerValidator(): TieredPaywallLedgerValidator {
  return new TieredPaywallLedgerValidator(
    [
      new TieredPaywallLedgerRequiredNameRule("tiered paywall ledger needs an entry"),
      new TieredPaywallLedgerRevisionRangeRule(86400, 86400),
      new TieredPaywallLedgerCodePrefixRule("X"),
      new TieredPaywallLedgerRequiredJourneyIdRule("tiered paywall ledger needs a value"),
    ],
  );
}
