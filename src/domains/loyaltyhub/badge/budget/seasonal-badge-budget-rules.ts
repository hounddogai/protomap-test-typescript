import { SeasonalBadgeBudget } from "./seasonal-badge-budget.js";

/** A rule a seasonal badge budget must pass. Check returns its problems, or none. */
export interface SeasonalBadgeBudgetRule {
  check(item: SeasonalBadgeBudget): string[];
}

export class SeasonalBadgeBudgetActiveGuardRule implements SeasonalBadgeBudgetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalBadgeBudget): string[] {
    if (item.active && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while active`];
    return [];
  }
}

export class SeasonalBadgeBudgetBudgetRangeRule implements SeasonalBadgeBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalBadgeBudget): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalBadgeBudgetCodeLengthRule implements SeasonalBadgeBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBadgeBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalBadgeBudgetRequiredCodeRule implements SeasonalBadgeBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBadgeBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal badge budget. */
export class SeasonalBadgeBudgetValidator {
  rules: SeasonalBadgeBudgetRule[];

  constructor(rules: SeasonalBadgeBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalBadgeBudget): string[] {
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

  requireValid(item: SeasonalBadgeBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalBadgeBudget[]): Map<string, string[]> {
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

export function defaultSeasonalBadgeBudgetValidator(): SeasonalBadgeBudgetValidator {
  return new SeasonalBadgeBudgetValidator(
    [
      new SeasonalBadgeBudgetActiveGuardRule(255),
      new SeasonalBadgeBudgetBudgetRangeRule(2.4, 796.8),
      new SeasonalBadgeBudgetCodeLengthRule(3600),
      new SeasonalBadgeBudgetRequiredCodeRule("seasonal badge budget needs an entry"),
    ],
  );
}
