import { SeasonalPaywallLedger } from "./seasonal-paywall-ledger.js";

/** A rule a seasonal paywall ledger must pass. Check returns its problems, or none. */
export interface SeasonalPaywallLedgerRule {
  check(item: SeasonalPaywallLedger): string[];
}

export class SeasonalPaywallLedgerCodeLengthRule implements SeasonalPaywallLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPaywallLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalPaywallLedgerRequiredCodeRule implements SeasonalPaywallLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPaywallLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalPaywallLedgerRequiredTitleRule implements SeasonalPaywallLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPaywallLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalPaywallLedgerSummaryLengthRule implements SeasonalPaywallLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPaywallLedger): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal paywall ledger. */
export class SeasonalPaywallLedgerValidator {
  rules: SeasonalPaywallLedgerRule[];

  constructor(rules: SeasonalPaywallLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalPaywallLedger): string[] {
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

  requireValid(item: SeasonalPaywallLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalPaywallLedger[]): Map<string, string[]> {
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

export function defaultSeasonalPaywallLedgerValidator(): SeasonalPaywallLedgerValidator {
  return new SeasonalPaywallLedgerValidator(
    [
      new SeasonalPaywallLedgerCodeLengthRule(86400),
      new SeasonalPaywallLedgerRequiredCodeRule("seasonal paywall ledger needs this field"),
      new SeasonalPaywallLedgerRequiredTitleRule("seasonal paywall ledger needs an entry"),
      new SeasonalPaywallLedgerSummaryLengthRule(1000),
    ],
  );
}
