import { WeightedSubscriptionMilestone } from "./weighted-subscription-milestone.js";

/** A rule a weighted subscription milestone must pass. Check returns its problems, or none. */
export interface WeightedSubscriptionMilestoneRule {
  check(item: WeightedSubscriptionMilestone): string[];
}

export class WeightedSubscriptionMilestoneOpenRateRangeRule implements WeightedSubscriptionMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedSubscriptionMilestone): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedSubscriptionMilestoneTitleLengthRule implements WeightedSubscriptionMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedSubscriptionMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedSubscriptionMilestoneRequiredTitleRule implements WeightedSubscriptionMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedSubscriptionMilestone): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted subscription milestone. */
export class WeightedSubscriptionMilestoneValidator {
  rules: WeightedSubscriptionMilestoneRule[];

  constructor(rules: WeightedSubscriptionMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedSubscriptionMilestone): string[] {
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

  requireValid(item: WeightedSubscriptionMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedSubscriptionMilestone[]): Map<string, string[]> {
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

export function defaultWeightedSubscriptionMilestoneValidator(): WeightedSubscriptionMilestoneValidator {
  return new WeightedSubscriptionMilestoneValidator(
    [
      new WeightedSubscriptionMilestoneOpenRateRangeRule(3.4, 2706.2),
      new WeightedSubscriptionMilestoneTitleLengthRule(16),
      new WeightedSubscriptionMilestoneRequiredTitleRule("weighted subscription milestone needs a value"),
    ],
  );
}
