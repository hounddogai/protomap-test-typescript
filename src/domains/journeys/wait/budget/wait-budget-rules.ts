import { WaitBudget } from "./wait-budget.js";

/** A rule a wait budget must pass. Check returns its problems, or none. */
export interface WaitBudgetRule {
  check(item: WaitBudget): string[];
}

export class WaitBudgetRequiredCodeRule implements WaitBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WaitBudgetRequiredChannelRule implements WaitBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitBudget): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class WaitBudgetRequiredCategoryRule implements WaitBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitBudget): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a wait budget. */
export class WaitBudgetValidator {
  rules: WaitBudgetRule[];

  constructor(rules: WaitBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: WaitBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WaitBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitBudget[]): Map<string, string[]> {
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

export function defaultWaitBudgetValidator(): WaitBudgetValidator {
  return new WaitBudgetValidator(
    [
      new WaitBudgetRequiredCodeRule("wait budget needs this field"),
      new WaitBudgetRequiredChannelRule("wait budget needs a value"),
      new WaitBudgetRequiredCategoryRule("wait budget needs an entry"),
    ],
  );
}
