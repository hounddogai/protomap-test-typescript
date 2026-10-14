import { ManualStreakException } from "./manual-streak-exception.js";

/** A rule a manual streak exception must pass. Check returns its problems, or none. */
export interface ManualStreakExceptionRule {
  check(item: ManualStreakException): string[];
}

export class ManualStreakExceptionRatioRangeRule implements ManualStreakExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualStreakException): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualStreakExceptionDurationMinutesRangeRule implements ManualStreakExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualStreakException): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualStreakExceptionCodeLengthRule implements ManualStreakExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualStreakException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualStreakExceptionCostRangeRule implements ManualStreakExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualStreakException): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual streak exception. */
export class ManualStreakExceptionValidator {
  rules: ManualStreakExceptionRule[];

  constructor(rules: ManualStreakExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: ManualStreakException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualStreakException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualStreakException[]): Map<string, string[]> {
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

export function defaultManualStreakExceptionValidator(): ManualStreakExceptionValidator {
  return new ManualStreakExceptionValidator(
    [
      new ManualStreakExceptionRatioRangeRule(5.2, 4223.2),
      new ManualStreakExceptionDurationMinutesRangeRule(255, 1000),
      new ManualStreakExceptionCodeLengthRule(80),
      new ManualStreakExceptionCostRangeRule(5, 2520.8),
    ],
  );
}
