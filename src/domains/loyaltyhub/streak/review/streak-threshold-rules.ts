import * as text from "../../../../kit/text.js";
import { StreakThreshold } from "./streak-threshold.js";

/** A rule a streak threshold must pass. Check returns its problems, or none. */
export interface StreakThresholdRule {
  check(item: StreakThreshold): string[];
}

export class StreakThresholdAllowedCohortRule implements StreakThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StreakThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is duplicated`];
    return [];
  }
}

export class StreakThresholdBudgetRangeRule implements StreakThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakThreshold): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StreakThresholdCohortLengthRule implements StreakThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakThreshold): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a streak threshold. */
export class StreakThresholdValidator {
  rules: StreakThresholdRule[];

  constructor(rules: StreakThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: StreakThreshold): string[] {
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

  requireValid(item: StreakThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakThreshold[]): Map<string, string[]> {
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

export function defaultStreakThresholdValidator(): StreakThresholdValidator {
  return new StreakThresholdValidator(
    [
      new StreakThresholdAllowedCohortRule([]),
      new StreakThresholdBudgetRangeRule(4.7, 4720.8),
      new StreakThresholdCohortLengthRule(86400),
    ],
  );
}
