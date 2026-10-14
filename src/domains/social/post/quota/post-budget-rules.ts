import * as text from "../../../../kit/text.js";
import { PostBudget } from "./post-budget.js";

/** A rule a post budget must pass. Check returns its problems, or none. */
export interface PostBudgetRule {
  check(item: PostBudget): string[];
}

export class PostBudgetRequiredUnitRule implements PostBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostBudget): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class PostBudgetExpiresAtRangeRule implements PostBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostBudget): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PostBudgetCodePrefixRule implements PostBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PostBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PostBudgetAllowedCodeRule implements PostBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PostBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class PostBudgetMarginRangeRule implements PostBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostBudget): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a post budget. */
export class PostBudgetValidator {
  rules: PostBudgetRule[];

  constructor(rules: PostBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: PostBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostBudget[]): Map<string, string[]> {
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

export function defaultPostBudgetValidator(): PostBudgetValidator {
  return new PostBudgetValidator(
    [
      new PostBudgetRequiredUnitRule("post budget needs this field"),
      new PostBudgetExpiresAtRangeRule(16, 64),
      new PostBudgetCodePrefixRule("Q"),
      new PostBudgetAllowedCodeRule(["weighted", "tiered", "primary"]),
      new PostBudgetMarginRangeRule(0.8, 3833.4),
    ],
  );
}
