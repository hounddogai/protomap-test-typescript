import { DefaultRewardRuleBudget } from "./default-reward-rule-budget.js";

/** A rule a default reward rule budget must pass. Check returns its problems, or none. */
export interface DefaultRewardRuleBudgetRule {
  check(item: DefaultRewardRuleBudget): string[];
}

export class DefaultRewardRuleBudgetRequiredDescriptionRule implements DefaultRewardRuleBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultRewardRuleBudget): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultRewardRuleBudgetTitleLengthRule implements DefaultRewardRuleBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultRewardRuleBudget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultRewardRuleBudgetRequiredTitleRule implements DefaultRewardRuleBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultRewardRuleBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default reward rule budget. */
export class DefaultRewardRuleBudgetValidator {
  rules: DefaultRewardRuleBudgetRule[];

  constructor(rules: DefaultRewardRuleBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultRewardRuleBudget): string[] {
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

  requireValid(item: DefaultRewardRuleBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultRewardRuleBudget[]): Map<string, string[]> {
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

export function defaultDefaultRewardRuleBudgetValidator(): DefaultRewardRuleBudgetValidator {
  return new DefaultRewardRuleBudgetValidator(
    [
      new DefaultRewardRuleBudgetRequiredDescriptionRule("default reward rule budget needs this field"),
      new DefaultRewardRuleBudgetTitleLengthRule(1000),
      new DefaultRewardRuleBudgetRequiredTitleRule("default reward rule budget needs an entry"),
    ],
  );
}
