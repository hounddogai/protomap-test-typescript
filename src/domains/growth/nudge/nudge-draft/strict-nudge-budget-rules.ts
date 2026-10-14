import * as text from "../../../../kit/text.js";
import { StrictNudgeBudget } from "./strict-nudge-budget.js";

/** A rule a strict nudge budget must pass. Check returns its problems, or none. */
export interface StrictNudgeBudgetRule {
  check(item: StrictNudgeBudget): string[];
}

export class StrictNudgeBudgetAllowedTitleRule implements StrictNudgeBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictNudgeBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class StrictNudgeBudgetRetriesRangeRule implements StrictNudgeBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictNudgeBudget): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictNudgeBudgetCodeLengthRule implements StrictNudgeBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictNudgeBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictNudgeBudgetRequiredTitleRule implements StrictNudgeBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictNudgeBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictNudgeBudgetScoreRangeRule implements StrictNudgeBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictNudgeBudget): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictNudgeBudgetCodePrefixRule implements StrictNudgeBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictNudgeBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict nudge budget. */
export class StrictNudgeBudgetValidator {
  rules: StrictNudgeBudgetRule[];

  constructor(rules: StrictNudgeBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: StrictNudgeBudget): string[] {
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

  requireValid(item: StrictNudgeBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictNudgeBudget[]): Map<string, string[]> {
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

export function defaultStrictNudgeBudgetValidator(): StrictNudgeBudgetValidator {
  return new StrictNudgeBudgetValidator(
    [
      new StrictNudgeBudgetAllowedTitleRule(["legacy", "manual"]),
      new StrictNudgeBudgetRetriesRangeRule(32, 255),
      new StrictNudgeBudgetCodeLengthRule(86400),
      new StrictNudgeBudgetRequiredTitleRule("strict nudge budget needs an entry"),
      new StrictNudgeBudgetScoreRangeRule(6.4, 4213),
      new StrictNudgeBudgetCodePrefixRule("X"),
    ],
  );
}
