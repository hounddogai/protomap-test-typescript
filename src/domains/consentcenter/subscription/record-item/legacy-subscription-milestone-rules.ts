import * as text from "../../../../kit/text.js";
import { LegacySubscriptionMilestone } from "./legacy-subscription-milestone.js";

/** A rule a legacy subscription milestone must pass. Check returns its problems, or none. */
export interface LegacySubscriptionMilestoneRule {
  check(item: LegacySubscriptionMilestone): string[];
}

export class LegacySubscriptionMilestoneAllowedCodeRule implements LegacySubscriptionMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacySubscriptionMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class LegacySubscriptionMilestoneTitleLengthRule implements LegacySubscriptionMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySubscriptionMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacySubscriptionMilestoneCodeLengthRule implements LegacySubscriptionMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySubscriptionMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacySubscriptionMilestoneRequiredCodeRule implements LegacySubscriptionMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacySubscriptionMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacySubscriptionMilestoneRequiredTitleRule implements LegacySubscriptionMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacySubscriptionMilestone): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacySubscriptionMilestoneCostRangeRule implements LegacySubscriptionMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacySubscriptionMilestone): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy subscription milestone. */
export class LegacySubscriptionMilestoneValidator {
  rules: LegacySubscriptionMilestoneRule[];

  constructor(rules: LegacySubscriptionMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: LegacySubscriptionMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacySubscriptionMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacySubscriptionMilestone[]): Map<string, string[]> {
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

export function defaultLegacySubscriptionMilestoneValidator(): LegacySubscriptionMilestoneValidator {
  return new LegacySubscriptionMilestoneValidator(
    [
      new LegacySubscriptionMilestoneAllowedCodeRule(["manual", "primary", "tiered"]),
      new LegacySubscriptionMilestoneTitleLengthRule(120),
      new LegacySubscriptionMilestoneCodeLengthRule(16),
      new LegacySubscriptionMilestoneRequiredCodeRule("legacy subscription milestone needs this field"),
      new LegacySubscriptionMilestoneRequiredTitleRule("legacy subscription milestone needs this field"),
      new LegacySubscriptionMilestoneCostRangeRule(1.4, 583.1),
    ],
  );
}
