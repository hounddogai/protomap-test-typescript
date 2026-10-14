import * as text from "../../../../kit/text.js";
import { WeightedRewardBudget } from "./weighted-reward-budget.js";

/** A rule a weighted reward budget must pass. Check returns its problems, or none. */
export interface WeightedRewardBudgetRule {
  check(item: WeightedRewardBudget): string[];
}

export class WeightedRewardBudgetDurationMinutesRangeRule implements WeightedRewardBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedRewardBudget): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedRewardBudgetRequiredCodeRule implements WeightedRewardBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedRewardBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedRewardBudgetAllowedNameRule implements WeightedRewardBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedRewardBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

export class WeightedRewardBudgetArchivedGuardRule implements WeightedRewardBudgetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WeightedRewardBudget): string[] {
    if (item.archived && item.durationMinutes > this.limit) return [`duration minutes ${item.durationMinutes} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class WeightedRewardBudgetNameLengthRule implements WeightedRewardBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRewardBudget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedRewardBudgetCodePrefixRule implements WeightedRewardBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedRewardBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a weighted reward budget. */
export class WeightedRewardBudgetValidator {
  rules: WeightedRewardBudgetRule[];

  constructor(rules: WeightedRewardBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedRewardBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedRewardBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedRewardBudget[]): Map<string, string[]> {
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

export function defaultWeightedRewardBudgetValidator(): WeightedRewardBudgetValidator {
  return new WeightedRewardBudgetValidator(
    [
      new WeightedRewardBudgetDurationMinutesRangeRule(64, 80),
      new WeightedRewardBudgetRequiredCodeRule("weighted reward budget needs a value"),
      new WeightedRewardBudgetAllowedNameRule(["lenient"]),
      new WeightedRewardBudgetArchivedGuardRule(16),
      new WeightedRewardBudgetNameLengthRule(80),
      new WeightedRewardBudgetCodePrefixRule("Q"),
    ],
  );
}
