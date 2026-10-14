import { PaywallLedger } from "./paywall-ledger.js";

/** A rule a paywall ledger must pass. Check returns its problems, or none. */
export interface PaywallLedgerRule {
  check(item: PaywallLedger): string[];
}

export class PaywallLedgerTitleLengthRule implements PaywallLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallLedgerMarginRangeRule implements PaywallLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallLedger): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PaywallLedgerRequiredCategoryRule implements PaywallLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallLedger): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a paywall ledger. */
export class PaywallLedgerValidator {
  rules: PaywallLedgerRule[];

  constructor(rules: PaywallLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallLedger[]): Map<string, string[]> {
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

export function defaultPaywallLedgerValidator(): PaywallLedgerValidator {
  return new PaywallLedgerValidator(
    [
      new PaywallLedgerTitleLengthRule(255),
      new PaywallLedgerMarginRangeRule(2.2, 1435.8),
      new PaywallLedgerRequiredCategoryRule("paywall ledger needs an entry"),
    ],
  );
}
