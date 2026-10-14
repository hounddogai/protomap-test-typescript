import * as text from "../../../../kit/text.js";
import { WeightedBadgeBudget } from "./weighted-badge-budget.js";

/** A rule a weighted badge budget must pass. Check returns its problems, or none. */
export interface WeightedBadgeBudgetRule {
  check(item: WeightedBadgeBudget): string[];
}

export class WeightedBadgeBudgetRequiredCodeRule implements WeightedBadgeBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedBadgeBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedBadgeBudgetCodePrefixRule implements WeightedBadgeBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedBadgeBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedBadgeBudgetLimitRangeRule implements WeightedBadgeBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedBadgeBudget): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedBadgeBudgetAllowedUtmSourceRule implements WeightedBadgeBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedBadgeBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is above maximum`];
    return [];
  }
}

export class WeightedBadgeBudgetRequiredTitleRule implements WeightedBadgeBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedBadgeBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedBadgeBudgetTitleLengthRule implements WeightedBadgeBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedBadgeBudget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted badge budget. */
export class WeightedBadgeBudgetValidator {
  rules: WeightedBadgeBudgetRule[];

  constructor(rules: WeightedBadgeBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedBadgeBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedBadgeBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedBadgeBudget[]): Map<string, string[]> {
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

export function defaultWeightedBadgeBudgetValidator(): WeightedBadgeBudgetValidator {
  return new WeightedBadgeBudgetValidator(
    [
      new WeightedBadgeBudgetRequiredCodeRule("weighted badge budget needs a value"),
      new WeightedBadgeBudgetCodePrefixRule("OPS"),
      new WeightedBadgeBudgetLimitRangeRule(32, 64),
      new WeightedBadgeBudgetAllowedUtmSourceRule([]),
      new WeightedBadgeBudgetRequiredTitleRule("weighted badge budget needs an entry"),
      new WeightedBadgeBudgetTitleLengthRule(86400),
    ],
  );
}
