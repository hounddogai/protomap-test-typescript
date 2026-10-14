import { StrictReplyBudget } from "./strict-reply-budget.js";

/** A rule a strict reply budget must pass. Check returns its problems, or none. */
export interface StrictReplyBudgetRule {
  check(item: StrictReplyBudget): string[];
}

export class StrictReplyBudgetRegionLengthRule implements StrictReplyBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictReplyBudget): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictReplyBudgetLabelLengthRule implements StrictReplyBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictReplyBudget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictReplyBudgetUpdatedAtRangeRule implements StrictReplyBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictReplyBudget): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictReplyBudgetRequiredLabelRule implements StrictReplyBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictReplyBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StrictReplyBudgetExpiresAtRangeRule implements StrictReplyBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictReplyBudget): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict reply budget. */
export class StrictReplyBudgetValidator {
  rules: StrictReplyBudgetRule[];

  constructor(rules: StrictReplyBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: StrictReplyBudget): string[] {
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

  requireValid(item: StrictReplyBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictReplyBudget[]): Map<string, string[]> {
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

export function defaultStrictReplyBudgetValidator(): StrictReplyBudgetValidator {
  return new StrictReplyBudgetValidator(
    [
      new StrictReplyBudgetRegionLengthRule(1000),
      new StrictReplyBudgetLabelLengthRule(80),
      new StrictReplyBudgetUpdatedAtRangeRule(120, 1000),
      new StrictReplyBudgetRequiredLabelRule("strict reply budget needs an entry"),
      new StrictReplyBudgetExpiresAtRangeRule(32, 3600),
    ],
  );
}
