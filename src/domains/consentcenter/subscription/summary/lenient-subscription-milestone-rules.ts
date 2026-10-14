import * as text from "../../../../kit/text.js";
import { LenientSubscriptionMilestone } from "./lenient-subscription-milestone.js";

/** A rule a lenient subscription milestone must pass. Check returns its problems, or none. */
export interface LenientSubscriptionMilestoneRule {
  check(item: LenientSubscriptionMilestone): string[];
}

export class LenientSubscriptionMilestoneBudgetRangeRule implements LenientSubscriptionMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientSubscriptionMilestone): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientSubscriptionMilestoneAllowedCategoryRule implements LenientSubscriptionMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientSubscriptionMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is stale`];
    return [];
  }
}

export class LenientSubscriptionMilestoneCodeLengthRule implements LenientSubscriptionMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientSubscriptionMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient subscription milestone. */
export class LenientSubscriptionMilestoneValidator {
  rules: LenientSubscriptionMilestoneRule[];

  constructor(rules: LenientSubscriptionMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: LenientSubscriptionMilestone): string[] {
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

  requireValid(item: LenientSubscriptionMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientSubscriptionMilestone[]): Map<string, string[]> {
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

export function defaultLenientSubscriptionMilestoneValidator(): LenientSubscriptionMilestoneValidator {
  return new LenientSubscriptionMilestoneValidator(
    [
      new LenientSubscriptionMilestoneBudgetRangeRule(3.1, 1617.4),
      new LenientSubscriptionMilestoneAllowedCategoryRule([]),
      new LenientSubscriptionMilestoneCodeLengthRule(1000),
    ],
  );
}
