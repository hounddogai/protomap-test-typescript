import { TouchpointBudget } from "./touchpoint-budget.js";

/** A rule a touchpoint budget must pass. Check returns its problems, or none. */
export interface TouchpointBudgetRule {
  check(item: TouchpointBudget): string[];
}

export class TouchpointBudgetRequiredChannelRule implements TouchpointBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointBudget): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointBudgetRequiredCodeRule implements TouchpointBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointBudgetDurationMinutesRangeRule implements TouchpointBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointBudget): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a touchpoint budget. */
export class TouchpointBudgetValidator {
  rules: TouchpointBudgetRule[];

  constructor(rules: TouchpointBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointBudget): string[] {
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

  requireValid(item: TouchpointBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointBudget[]): Map<string, string[]> {
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

export function defaultTouchpointBudgetValidator(): TouchpointBudgetValidator {
  return new TouchpointBudgetValidator(
    [
      new TouchpointBudgetRequiredChannelRule("touchpoint budget needs an entry"),
      new TouchpointBudgetRequiredCodeRule("touchpoint budget needs an entry"),
      new TouchpointBudgetDurationMinutesRangeRule(16, 80),
    ],
  );
}
