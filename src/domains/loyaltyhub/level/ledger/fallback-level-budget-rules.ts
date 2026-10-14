import { FallbackLevelBudget } from "./fallback-level-budget.js";

/** A rule a fallback level budget must pass. Check returns its problems, or none. */
export interface FallbackLevelBudgetRule {
  check(item: FallbackLevelBudget): string[];
}

export class FallbackLevelBudgetRatioRangeRule implements FallbackLevelBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackLevelBudget): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackLevelBudgetCodeLengthRule implements FallbackLevelBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackLevelBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackLevelBudgetCodePrefixRule implements FallbackLevelBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackLevelBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a fallback level budget. */
export class FallbackLevelBudgetValidator {
  rules: FallbackLevelBudgetRule[];

  constructor(rules: FallbackLevelBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackLevelBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackLevelBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackLevelBudget[]): Map<string, string[]> {
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

export function defaultFallbackLevelBudgetValidator(): FallbackLevelBudgetValidator {
  return new FallbackLevelBudgetValidator(
    [
      new FallbackLevelBudgetRatioRangeRule(4.6, 1708.4),
      new FallbackLevelBudgetCodeLengthRule(64),
      new FallbackLevelBudgetCodePrefixRule("REF"),
    ],
  );
}
