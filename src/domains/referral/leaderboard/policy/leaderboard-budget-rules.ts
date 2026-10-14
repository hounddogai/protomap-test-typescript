import * as text from "../../../../kit/text.js";
import { LeaderboardBudget } from "./leaderboard-budget.js";

/** A rule a leaderboard budget must pass. Check returns its problems, or none. */
export interface LeaderboardBudgetRule {
  check(item: LeaderboardBudget): string[];
}

export class LeaderboardBudgetRequiredLocaleRule implements LeaderboardBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardBudget): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardBudgetAllowedCodeRule implements LeaderboardBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LeaderboardBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class LeaderboardBudgetRequiredNameRule implements LeaderboardBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardBudget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardBudgetLocaleLengthRule implements LeaderboardBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardBudget): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardBudgetCodePrefixRule implements LeaderboardBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LeaderboardBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LeaderboardBudgetRequiredAudienceIdRule implements LeaderboardBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardBudget): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a leaderboard budget. */
export class LeaderboardBudgetValidator {
  rules: LeaderboardBudgetRule[];

  constructor(rules: LeaderboardBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LeaderboardBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardBudget[]): Map<string, string[]> {
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

export function defaultLeaderboardBudgetValidator(): LeaderboardBudgetValidator {
  return new LeaderboardBudgetValidator(
    [
      new LeaderboardBudgetRequiredLocaleRule("leaderboard budget needs this field"),
      new LeaderboardBudgetAllowedCodeRule(["rolling", "primary"]),
      new LeaderboardBudgetRequiredNameRule("leaderboard budget needs this field"),
      new LeaderboardBudgetLocaleLengthRule(3600),
      new LeaderboardBudgetCodePrefixRule("Q"),
      new LeaderboardBudgetRequiredAudienceIdRule("leaderboard budget needs this field"),
    ],
  );
}
