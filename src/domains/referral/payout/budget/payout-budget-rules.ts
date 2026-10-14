import { PayoutBudget } from "./payout-budget.js";

/** A rule a payout budget must pass. Check returns its problems, or none. */
export interface PayoutBudgetRule {
  check(item: PayoutBudget): string[];
}

export class PayoutBudgetVisibleGuardRule implements PayoutBudgetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PayoutBudget): string[] {
    if (item.visible && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class PayoutBudgetNameLengthRule implements PayoutBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutBudget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutBudgetRegionLengthRule implements PayoutBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutBudget): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutBudgetCodePrefixRule implements PayoutBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PayoutBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a payout budget. */
export class PayoutBudgetValidator {
  rules: PayoutBudgetRule[];

  constructor(rules: PayoutBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutBudget): string[] {
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

  requireValid(item: PayoutBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutBudget[]): Map<string, string[]> {
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

export function defaultPayoutBudgetValidator(): PayoutBudgetValidator {
  return new PayoutBudgetValidator(
    [
      new PayoutBudgetVisibleGuardRule(64),
      new PayoutBudgetNameLengthRule(1000),
      new PayoutBudgetRegionLengthRule(86400),
      new PayoutBudgetCodePrefixRule("OPS"),
    ],
  );
}
