import * as text from "../../../../kit/text.js";
import { RewardThreshold } from "./reward-threshold.js";

/** A rule a reward threshold must pass. Check returns its problems, or none. */
export interface RewardThresholdRule {
  check(item: RewardThreshold): string[];
}

export class RewardThresholdAllowedCodeRule implements RewardThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class RewardThresholdGraceDaysRangeRule implements RewardThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardThreshold): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardThresholdOwnerIdLengthRule implements RewardThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardThreshold): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardThresholdCreatedAtRangeRule implements RewardThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardThreshold): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardThresholdReviewerLengthRule implements RewardThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardThreshold): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward threshold. */
export class RewardThresholdValidator {
  rules: RewardThresholdRule[];

  constructor(rules: RewardThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: RewardThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardThreshold[]): Map<string, string[]> {
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

export function defaultRewardThresholdValidator(): RewardThresholdValidator {
  return new RewardThresholdValidator(
    [
      new RewardThresholdAllowedCodeRule(["lenient"]),
      new RewardThresholdGraceDaysRangeRule(80, 86400),
      new RewardThresholdOwnerIdLengthRule(255),
      new RewardThresholdCreatedAtRangeRule(80, 120),
      new RewardThresholdReviewerLengthRule(86400),
    ],
  );
}
