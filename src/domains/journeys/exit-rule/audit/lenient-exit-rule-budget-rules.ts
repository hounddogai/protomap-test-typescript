import { LenientExitRuleBudget } from "./lenient-exit-rule-budget.js";

/** A rule a lenient exit rule budget must pass. Check returns its problems, or none. */
export interface LenientExitRuleBudgetRule {
  check(item: LenientExitRuleBudget): string[];
}

export class LenientExitRuleBudgetFloorValueRangeRule implements LenientExitRuleBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientExitRuleBudget): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientExitRuleBudgetWindowDaysRangeRule implements LenientExitRuleBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientExitRuleBudget): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientExitRuleBudgetNameLengthRule implements LenientExitRuleBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientExitRuleBudget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientExitRuleBudgetDurationMinutesRangeRule implements LenientExitRuleBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientExitRuleBudget): string[] {
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

/** Runs every rule of a lenient exit rule budget. */
export class LenientExitRuleBudgetValidator {
  rules: LenientExitRuleBudgetRule[];

  constructor(rules: LenientExitRuleBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: LenientExitRuleBudget): string[] {
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

  requireValid(item: LenientExitRuleBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientExitRuleBudget[]): Map<string, string[]> {
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

export function defaultLenientExitRuleBudgetValidator(): LenientExitRuleBudgetValidator {
  return new LenientExitRuleBudgetValidator(
    [
      new LenientExitRuleBudgetFloorValueRangeRule(8.8, 3225.7),
      new LenientExitRuleBudgetWindowDaysRangeRule(16, 32),
      new LenientExitRuleBudgetNameLengthRule(32),
      new LenientExitRuleBudgetDurationMinutesRangeRule(1000, 1000),
    ],
  );
}
