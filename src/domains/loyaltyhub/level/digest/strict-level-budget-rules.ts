import { StrictLevelBudget } from "./strict-level-budget.js";

/** A rule a strict level budget must pass. Check returns its problems, or none. */
export interface StrictLevelBudgetRule {
  check(item: StrictLevelBudget): string[];
}

export class StrictLevelBudgetRequiredCohortRule implements StrictLevelBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictLevelBudget): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class StrictLevelBudgetPinnedGuardRule implements StrictLevelBudgetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictLevelBudget): string[] {
    if (item.pinned && item.updatedAt > this.limit) return [`updated at ${item.updatedAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class StrictLevelBudgetRatioRangeRule implements StrictLevelBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictLevelBudget): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictLevelBudgetRequiredLabelRule implements StrictLevelBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictLevelBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StrictLevelBudgetCodeLengthRule implements StrictLevelBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictLevelBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict level budget. */
export class StrictLevelBudgetValidator {
  rules: StrictLevelBudgetRule[];

  constructor(rules: StrictLevelBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: StrictLevelBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictLevelBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictLevelBudget[]): Map<string, string[]> {
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

export function defaultStrictLevelBudgetValidator(): StrictLevelBudgetValidator {
  return new StrictLevelBudgetValidator(
    [
      new StrictLevelBudgetRequiredCohortRule("strict level budget needs this field"),
      new StrictLevelBudgetPinnedGuardRule(120),
      new StrictLevelBudgetRatioRangeRule(9, 4200.2),
      new StrictLevelBudgetRequiredLabelRule("strict level budget needs an entry"),
      new StrictLevelBudgetCodeLengthRule(255),
    ],
  );
}
