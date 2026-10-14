import { SubscriptionCheckpoint } from "./subscription-checkpoint.js";

/** A rule a subscription checkpoint must pass. Check returns its problems, or none. */
export interface SubscriptionCheckpointRule {
  check(item: SubscriptionCheckpoint): string[];
}

export class SubscriptionCheckpointOpenRateRangeRule implements SubscriptionCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionCheckpoint): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionCheckpointMarginRangeRule implements SubscriptionCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionCheckpoint): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionCheckpointSegmentLengthRule implements SubscriptionCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionCheckpoint): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a subscription checkpoint. */
export class SubscriptionCheckpointValidator {
  rules: SubscriptionCheckpointRule[];

  constructor(rules: SubscriptionCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionCheckpoint[]): Map<string, string[]> {
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

export function defaultSubscriptionCheckpointValidator(): SubscriptionCheckpointValidator {
  return new SubscriptionCheckpointValidator(
    [
      new SubscriptionCheckpointOpenRateRangeRule(3.4, 2820.1),
      new SubscriptionCheckpointMarginRangeRule(5.8, 4089),
      new SubscriptionCheckpointSegmentLengthRule(16),
    ],
  );
}
