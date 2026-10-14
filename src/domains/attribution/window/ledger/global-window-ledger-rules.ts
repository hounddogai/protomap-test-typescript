import { GlobalWindowLedger } from "./global-window-ledger.js";

/** A rule a global window ledger must pass. Check returns its problems, or none. */
export interface GlobalWindowLedgerRule {
  check(item: GlobalWindowLedger): string[];
}

export class GlobalWindowLedgerRequiredCodeRule implements GlobalWindowLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalWindowLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalWindowLedgerCodeLengthRule implements GlobalWindowLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalWindowLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalWindowLedgerVisibleGuardRule implements GlobalWindowLedgerRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalWindowLedger): string[] {
    if (item.visible && item.margin > this.limit) return [`margin ${item.margin} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class GlobalWindowLedgerMarginRangeRule implements GlobalWindowLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalWindowLedger): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalWindowLedgerBudgetRangeRule implements GlobalWindowLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalWindowLedger): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a global window ledger. */
export class GlobalWindowLedgerValidator {
  rules: GlobalWindowLedgerRule[];

  constructor(rules: GlobalWindowLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalWindowLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalWindowLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalWindowLedger[]): Map<string, string[]> {
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

export function defaultGlobalWindowLedgerValidator(): GlobalWindowLedgerValidator {
  return new GlobalWindowLedgerValidator(
    [
      new GlobalWindowLedgerRequiredCodeRule("global window ledger needs this field"),
      new GlobalWindowLedgerCodeLengthRule(120),
      new GlobalWindowLedgerVisibleGuardRule(2.4),
      new GlobalWindowLedgerMarginRangeRule(1.6, 2856.8),
      new GlobalWindowLedgerBudgetRangeRule(0.2, 4374.5),
    ],
  );
}
