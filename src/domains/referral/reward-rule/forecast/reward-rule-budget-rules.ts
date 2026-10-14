import * as text from "../../../../kit/text.js";
import { RewardRuleBudget } from "./reward-rule-budget.js";

/** A rule a reward rule budget must pass. Check returns its problems, or none. */
export interface RewardRuleBudgetRule {
  check(item: RewardRuleBudget): string[];
}

export class RewardRuleBudgetBudgetRangeRule implements RewardRuleBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleBudget): string[] {
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

export class RewardRuleBudgetAllowedCodeRule implements RewardRuleBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardRuleBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class RewardRuleBudgetApprovedGuardRule implements RewardRuleBudgetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RewardRuleBudget): string[] {
    if (item.approved && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a reward rule budget. */
export class RewardRuleBudgetValidator {
  rules: RewardRuleBudgetRule[];

  constructor(rules: RewardRuleBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleBudget): string[] {
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

  requireValid(item: RewardRuleBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleBudget[]): Map<string, string[]> {
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

export function defaultRewardRuleBudgetValidator(): RewardRuleBudgetValidator {
  return new RewardRuleBudgetValidator(
    [
      new RewardRuleBudgetBudgetRangeRule(6.8, 4463.9),
      new RewardRuleBudgetAllowedCodeRule(["capped", "scheduled"]),
      new RewardRuleBudgetApprovedGuardRule(0.4),
    ],
  );
}
