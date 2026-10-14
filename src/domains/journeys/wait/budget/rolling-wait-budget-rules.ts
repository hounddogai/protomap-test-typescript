import * as text from "../../../../kit/text.js";
import { RollingWaitBudget } from "./rolling-wait-budget.js";

/** A rule a rolling wait budget must pass. Check returns its problems, or none. */
export interface RollingWaitBudgetRule {
  check(item: RollingWaitBudget): string[];
}

export class RollingWaitBudgetAllowedTitleRule implements RollingWaitBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingWaitBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is unknown`];
    return [];
  }
}

export class RollingWaitBudgetTitleLengthRule implements RollingWaitBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingWaitBudget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingWaitBudgetNameLengthRule implements RollingWaitBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingWaitBudget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingWaitBudgetClicksRangeRule implements RollingWaitBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWaitBudget): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingWaitBudgetRequiredNameRule implements RollingWaitBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingWaitBudget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling wait budget. */
export class RollingWaitBudgetValidator {
  rules: RollingWaitBudgetRule[];

  constructor(rules: RollingWaitBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: RollingWaitBudget): string[] {
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

  requireValid(item: RollingWaitBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingWaitBudget[]): Map<string, string[]> {
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

export function defaultRollingWaitBudgetValidator(): RollingWaitBudgetValidator {
  return new RollingWaitBudgetValidator(
    [
      new RollingWaitBudgetAllowedTitleRule([]),
      new RollingWaitBudgetTitleLengthRule(120),
      new RollingWaitBudgetNameLengthRule(255),
      new RollingWaitBudgetClicksRangeRule(16, 120),
      new RollingWaitBudgetRequiredNameRule("rolling wait budget needs this field"),
    ],
  );
}
