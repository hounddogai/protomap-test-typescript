import { FallbackReplyBudget } from "./fallback-reply-budget.js";

/** A rule a fallback reply budget must pass. Check returns its problems, or none. */
export interface FallbackReplyBudgetRule {
  check(item: FallbackReplyBudget): string[];
}

export class FallbackReplyBudgetCeilingRangeRule implements FallbackReplyBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackReplyBudget): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackReplyBudgetStartsAtRangeRule implements FallbackReplyBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackReplyBudget): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackReplyBudgetRatioRangeRule implements FallbackReplyBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackReplyBudget): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackReplyBudgetNameLengthRule implements FallbackReplyBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackReplyBudget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackReplyBudgetCodeLengthRule implements FallbackReplyBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackReplyBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback reply budget. */
export class FallbackReplyBudgetValidator {
  rules: FallbackReplyBudgetRule[];

  constructor(rules: FallbackReplyBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackReplyBudget): string[] {
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

  requireValid(item: FallbackReplyBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackReplyBudget[]): Map<string, string[]> {
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

export function defaultFallbackReplyBudgetValidator(): FallbackReplyBudgetValidator {
  return new FallbackReplyBudgetValidator(
    [
      new FallbackReplyBudgetCeilingRangeRule(8.9, 3528.7),
      new FallbackReplyBudgetStartsAtRangeRule(80, 1000),
      new FallbackReplyBudgetRatioRangeRule(9.3, 3660.6),
      new FallbackReplyBudgetNameLengthRule(86400),
      new FallbackReplyBudgetCodeLengthRule(64),
    ],
  );
}
