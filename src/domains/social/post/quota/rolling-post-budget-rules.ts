import { RollingPostBudget } from "./rolling-post-budget.js";

/** A rule a rolling post budget must pass. Check returns its problems, or none. */
export interface RollingPostBudgetRule {
  check(item: RollingPostBudget): string[];
}

export class RollingPostBudgetCodePrefixRule implements RollingPostBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingPostBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingPostBudgetRequiredUnitRule implements RollingPostBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPostBudget): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPostBudgetRequiredReviewerRule implements RollingPostBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPostBudget): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling post budget. */
export class RollingPostBudgetValidator {
  rules: RollingPostBudgetRule[];

  constructor(rules: RollingPostBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPostBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingPostBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPostBudget[]): Map<string, string[]> {
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

export function defaultRollingPostBudgetValidator(): RollingPostBudgetValidator {
  return new RollingPostBudgetValidator(
    [
      new RollingPostBudgetCodePrefixRule("ACM"),
      new RollingPostBudgetRequiredUnitRule("rolling post budget needs a value"),
      new RollingPostBudgetRequiredReviewerRule("rolling post budget needs an entry"),
    ],
  );
}
