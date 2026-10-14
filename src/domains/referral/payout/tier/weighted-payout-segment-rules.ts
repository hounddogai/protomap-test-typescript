import * as text from "../../../../kit/text.js";
import { WeightedPayoutSegment } from "./weighted-payout-segment.js";

/** A rule a weighted payout segment must pass. Check returns its problems, or none. */
export interface WeightedPayoutSegmentRule {
  check(item: WeightedPayoutSegment): string[];
}

export class WeightedPayoutSegmentPriorityRangeRule implements WeightedPayoutSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPayoutSegment): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedPayoutSegmentAllowedTitleRule implements WeightedPayoutSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedPayoutSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

export class WeightedPayoutSegmentRequiredCodeRule implements WeightedPayoutSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPayoutSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted payout segment. */
export class WeightedPayoutSegmentValidator {
  rules: WeightedPayoutSegmentRule[];

  constructor(rules: WeightedPayoutSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPayoutSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedPayoutSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPayoutSegment[]): Map<string, string[]> {
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

export function defaultWeightedPayoutSegmentValidator(): WeightedPayoutSegmentValidator {
  return new WeightedPayoutSegmentValidator(
    [
      new WeightedPayoutSegmentPriorityRangeRule(3600, 86400),
      new WeightedPayoutSegmentAllowedTitleRule(["regional", "regional"]),
      new WeightedPayoutSegmentRequiredCodeRule("weighted payout segment needs this field"),
    ],
  );
}
