import { DefaultPaywallBudget } from "./default-paywall-budget.js";

/** A rule a default paywall budget must pass. Check returns its problems, or none. */
export interface DefaultPaywallBudgetRule {
  check(item: DefaultPaywallBudget): string[];
}

export class DefaultPaywallBudgetRequiredNameRule implements DefaultPaywallBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPaywallBudget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPaywallBudgetRequiredLabelRule implements DefaultPaywallBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPaywallBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPaywallBudgetScoreRangeRule implements DefaultPaywallBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPaywallBudget): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultPaywallBudgetCodeLengthRule implements DefaultPaywallBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPaywallBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default paywall budget. */
export class DefaultPaywallBudgetValidator {
  rules: DefaultPaywallBudgetRule[];

  constructor(rules: DefaultPaywallBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPaywallBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultPaywallBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPaywallBudget[]): Map<string, string[]> {
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

export function defaultDefaultPaywallBudgetValidator(): DefaultPaywallBudgetValidator {
  return new DefaultPaywallBudgetValidator(
    [
      new DefaultPaywallBudgetRequiredNameRule("default paywall budget needs an entry"),
      new DefaultPaywallBudgetRequiredLabelRule("default paywall budget needs a value"),
      new DefaultPaywallBudgetScoreRangeRule(4.7, 3960.5),
      new DefaultPaywallBudgetCodeLengthRule(80),
    ],
  );
}
