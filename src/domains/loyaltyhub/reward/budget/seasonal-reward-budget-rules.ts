import * as text from "../../../../kit/text.js";
import { SeasonalRewardBudget } from "./seasonal-reward-budget.js";

/** A rule a seasonal reward budget must pass. Check returns its problems, or none. */
export interface SeasonalRewardBudgetRule {
  check(item: SeasonalRewardBudget): string[];
}

export class SeasonalRewardBudgetAllowedCodeRule implements SeasonalRewardBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalRewardBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class SeasonalRewardBudgetWindowDaysRangeRule implements SeasonalRewardBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalRewardBudget): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalRewardBudgetRequiredCountryRule implements SeasonalRewardBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalRewardBudget): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalRewardBudgetRequiredCategoryRule implements SeasonalRewardBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalRewardBudget): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalRewardBudgetMinimumRangeRule implements SeasonalRewardBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalRewardBudget): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalRewardBudgetLabelLengthRule implements SeasonalRewardBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalRewardBudget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal reward budget. */
export class SeasonalRewardBudgetValidator {
  rules: SeasonalRewardBudgetRule[];

  constructor(rules: SeasonalRewardBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalRewardBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalRewardBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalRewardBudget[]): Map<string, string[]> {
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

export function defaultSeasonalRewardBudgetValidator(): SeasonalRewardBudgetValidator {
  return new SeasonalRewardBudgetValidator(
    [
      new SeasonalRewardBudgetAllowedCodeRule(["default"]),
      new SeasonalRewardBudgetWindowDaysRangeRule(32, 1000),
      new SeasonalRewardBudgetRequiredCountryRule("seasonal reward budget needs an entry"),
      new SeasonalRewardBudgetRequiredCategoryRule("seasonal reward budget needs this field"),
      new SeasonalRewardBudgetMinimumRangeRule(0.9, 4399.9),
      new SeasonalRewardBudgetLabelLengthRule(1000),
    ],
  );
}
