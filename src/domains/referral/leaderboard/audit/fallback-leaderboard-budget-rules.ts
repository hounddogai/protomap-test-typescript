import * as text from "../../../../kit/text.js";
import { FallbackLeaderboardBudget } from "./fallback-leaderboard-budget.js";

/** A rule a fallback leaderboard budget must pass. Check returns its problems, or none. */
export interface FallbackLeaderboardBudgetRule {
  check(item: FallbackLeaderboardBudget): string[];
}

export class FallbackLeaderboardBudgetNameLengthRule implements FallbackLeaderboardBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackLeaderboardBudget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackLeaderboardBudgetImpressionsRangeRule implements FallbackLeaderboardBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackLeaderboardBudget): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackLeaderboardBudgetAllowedCodeRule implements FallbackLeaderboardBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackLeaderboardBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class FallbackLeaderboardBudgetSourceLengthRule implements FallbackLeaderboardBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackLeaderboardBudget): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackLeaderboardBudgetRequiredNameRule implements FallbackLeaderboardBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackLeaderboardBudget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback leaderboard budget. */
export class FallbackLeaderboardBudgetValidator {
  rules: FallbackLeaderboardBudgetRule[];

  constructor(rules: FallbackLeaderboardBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackLeaderboardBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackLeaderboardBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackLeaderboardBudget[]): Map<string, string[]> {
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

export function defaultFallbackLeaderboardBudgetValidator(): FallbackLeaderboardBudgetValidator {
  return new FallbackLeaderboardBudgetValidator(
    [
      new FallbackLeaderboardBudgetNameLengthRule(255),
      new FallbackLeaderboardBudgetImpressionsRangeRule(120, 3600),
      new FallbackLeaderboardBudgetAllowedCodeRule(["scheduled", "adaptive", "rolling"]),
      new FallbackLeaderboardBudgetSourceLengthRule(80),
      new FallbackLeaderboardBudgetRequiredNameRule("fallback leaderboard budget needs an entry"),
    ],
  );
}
