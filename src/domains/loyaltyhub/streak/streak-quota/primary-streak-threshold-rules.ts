import { PrimaryStreakThreshold } from "./primary-streak-threshold.js";

/** A rule a primary streak threshold must pass. Check returns its problems, or none. */
export interface PrimaryStreakThresholdRule {
  check(item: PrimaryStreakThreshold): string[];
}

export class PrimaryStreakThresholdMarginRangeRule implements PrimaryStreakThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryStreakThreshold): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryStreakThresholdRequiredUnitRule implements PrimaryStreakThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryStreakThreshold): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryStreakThresholdSegmentLengthRule implements PrimaryStreakThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryStreakThreshold): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary streak threshold. */
export class PrimaryStreakThresholdValidator {
  rules: PrimaryStreakThresholdRule[];

  constructor(rules: PrimaryStreakThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryStreakThreshold): string[] {
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

  requireValid(item: PrimaryStreakThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryStreakThreshold[]): Map<string, string[]> {
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

export function defaultPrimaryStreakThresholdValidator(): PrimaryStreakThresholdValidator {
  return new PrimaryStreakThresholdValidator(
    [
      new PrimaryStreakThresholdMarginRangeRule(9.4, 4929.7),
      new PrimaryStreakThresholdRequiredUnitRule("primary streak threshold needs a value"),
      new PrimaryStreakThresholdSegmentLengthRule(86400),
    ],
  );
}
