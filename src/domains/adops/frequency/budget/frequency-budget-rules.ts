import * as text from "../../../../kit/text.js";
import { FrequencyBudget } from "./frequency-budget.js";

/** A rule a frequency budget must pass. Check returns its problems, or none. */
export interface FrequencyBudgetRule {
  check(item: FrequencyBudget): string[];
}

export class FrequencyBudgetTitleLengthRule implements FrequencyBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyBudget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyBudgetRequiredTitleRule implements FrequencyBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyBudgetRetriesRangeRule implements FrequencyBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyBudget): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FrequencyBudgetAllowedCodeRule implements FrequencyBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FrequencyBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class FrequencyBudgetRequiredLocaleRule implements FrequencyBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyBudget): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyBudgetCapacityRangeRule implements FrequencyBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyBudget): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a frequency budget. */
export class FrequencyBudgetValidator {
  rules: FrequencyBudgetRule[];

  constructor(rules: FrequencyBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyBudget): string[] {
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

  requireValid(item: FrequencyBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyBudget[]): Map<string, string[]> {
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

export function defaultFrequencyBudgetValidator(): FrequencyBudgetValidator {
  return new FrequencyBudgetValidator(
    [
      new FrequencyBudgetTitleLengthRule(86400),
      new FrequencyBudgetRequiredTitleRule("frequency budget needs an entry"),
      new FrequencyBudgetRetriesRangeRule(80, 1000),
      new FrequencyBudgetAllowedCodeRule([]),
      new FrequencyBudgetRequiredLocaleRule("frequency budget needs an entry"),
      new FrequencyBudgetCapacityRangeRule(120, 120),
    ],
  );
}
