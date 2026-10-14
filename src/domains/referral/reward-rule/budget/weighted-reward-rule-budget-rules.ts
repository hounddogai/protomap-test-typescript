import { WeightedRewardRuleBudget } from "./weighted-reward-rule-budget.js";

/** A rule a weighted reward rule budget must pass. Check returns its problems, or none. */
export interface WeightedRewardRuleBudgetRule {
  check(item: WeightedRewardRuleBudget): string[];
}

export class WeightedRewardRuleBudgetRequiredCohortRule implements WeightedRewardRuleBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedRewardRuleBudget): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedRewardRuleBudgetMaximumRangeRule implements WeightedRewardRuleBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedRewardRuleBudget): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedRewardRuleBudgetRateRangeRule implements WeightedRewardRuleBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedRewardRuleBudget): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedRewardRuleBudgetCountryLengthRule implements WeightedRewardRuleBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRewardRuleBudget): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted reward rule budget. */
export class WeightedRewardRuleBudgetValidator {
  rules: WeightedRewardRuleBudgetRule[];

  constructor(rules: WeightedRewardRuleBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedRewardRuleBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedRewardRuleBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedRewardRuleBudget[]): Map<string, string[]> {
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

export function defaultWeightedRewardRuleBudgetValidator(): WeightedRewardRuleBudgetValidator {
  return new WeightedRewardRuleBudgetValidator(
    [
      new WeightedRewardRuleBudgetRequiredCohortRule("weighted reward rule budget needs a value"),
      new WeightedRewardRuleBudgetMaximumRangeRule(0.2, 353.1),
      new WeightedRewardRuleBudgetRateRangeRule(2.8, 3589.1),
      new WeightedRewardRuleBudgetCountryLengthRule(120),
    ],
  );
}
