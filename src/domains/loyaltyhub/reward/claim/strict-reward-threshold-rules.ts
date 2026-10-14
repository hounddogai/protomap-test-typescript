import { StrictRewardThreshold } from "./strict-reward-threshold.js";

/** A rule a strict reward threshold must pass. Check returns its problems, or none. */
export interface StrictRewardThresholdRule {
  check(item: StrictRewardThreshold): string[];
}

export class StrictRewardThresholdCodeLengthRule implements StrictRewardThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRewardThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRewardThresholdTimezoneLengthRule implements StrictRewardThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRewardThreshold): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRewardThresholdRequiredCodeRule implements StrictRewardThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRewardThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRewardThresholdAmountRangeRule implements StrictRewardThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRewardThreshold): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictRewardThresholdLabelLengthRule implements StrictRewardThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRewardThreshold): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRewardThresholdRequiredCohortRule implements StrictRewardThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRewardThreshold): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict reward threshold. */
export class StrictRewardThresholdValidator {
  rules: StrictRewardThresholdRule[];

  constructor(rules: StrictRewardThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: StrictRewardThreshold): string[] {
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

  requireValid(item: StrictRewardThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictRewardThreshold[]): Map<string, string[]> {
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

export function defaultStrictRewardThresholdValidator(): StrictRewardThresholdValidator {
  return new StrictRewardThresholdValidator(
    [
      new StrictRewardThresholdCodeLengthRule(86400),
      new StrictRewardThresholdTimezoneLengthRule(80),
      new StrictRewardThresholdRequiredCodeRule("strict reward threshold needs this field"),
      new StrictRewardThresholdAmountRangeRule(3.8, 2807.1),
      new StrictRewardThresholdLabelLengthRule(64),
      new StrictRewardThresholdRequiredCohortRule("strict reward threshold needs this field"),
    ],
  );
}
