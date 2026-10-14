import * as text from "../../../../kit/text.js";
import { RewardSummary } from "./reward-summary.js";

/** A rule a reward summary must pass. Check returns its problems, or none. */
export interface RewardSummaryRule {
  check(item: RewardSummary): string[];
}

export class RewardSummaryLabelLengthRule implements RewardSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardSummaryRequiredCodeRule implements RewardSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RewardSummaryRequiredLabelRule implements RewardSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RewardSummaryDurationMinutesRangeRule implements RewardSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardSummary): string[] {
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

export class RewardSummaryAllowedLabelRule implements RewardSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is blocked`];
    return [];
  }
}

/** Runs every rule of a reward summary. */
export class RewardSummaryValidator {
  rules: RewardSummaryRule[];

  constructor(rules: RewardSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: RewardSummary): string[] {
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

  requireValid(item: RewardSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardSummary[]): Map<string, string[]> {
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

export function defaultRewardSummaryValidator(): RewardSummaryValidator {
  return new RewardSummaryValidator(
    [
      new RewardSummaryLabelLengthRule(120),
      new RewardSummaryRequiredCodeRule("reward summary needs this field"),
      new RewardSummaryRequiredLabelRule("reward summary needs a value"),
      new RewardSummaryDurationMinutesRangeRule(80, 1000),
      new RewardSummaryAllowedLabelRule(["scheduled", "lenient"]),
    ],
  );
}
