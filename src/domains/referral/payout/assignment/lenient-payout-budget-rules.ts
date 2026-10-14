import { LenientPayoutBudget } from "./lenient-payout-budget.js";

/** A rule a lenient payout budget must pass. Check returns its problems, or none. */
export interface LenientPayoutBudgetRule {
  check(item: LenientPayoutBudget): string[];
}

export class LenientPayoutBudgetRequiredTitleRule implements LenientPayoutBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPayoutBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPayoutBudgetUnitLengthRule implements LenientPayoutBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPayoutBudget): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPayoutBudgetRequiredCodeRule implements LenientPayoutBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPayoutBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient payout budget. */
export class LenientPayoutBudgetValidator {
  rules: LenientPayoutBudgetRule[];

  constructor(rules: LenientPayoutBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPayoutBudget): string[] {
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

  requireValid(item: LenientPayoutBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPayoutBudget[]): Map<string, string[]> {
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

export function defaultLenientPayoutBudgetValidator(): LenientPayoutBudgetValidator {
  return new LenientPayoutBudgetValidator(
    [
      new LenientPayoutBudgetRequiredTitleRule("lenient payout budget needs an entry"),
      new LenientPayoutBudgetUnitLengthRule(3600),
      new LenientPayoutBudgetRequiredCodeRule("lenient payout budget needs an entry"),
    ],
  );
}
