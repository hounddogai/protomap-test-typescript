import * as text from "../../../../kit/text.js";
import { PaywallMilestone } from "./paywall-milestone.js";

/** A rule a paywall milestone must pass. Check returns its problems, or none. */
export interface PaywallMilestoneRule {
  check(item: PaywallMilestone): string[];
}

export class PaywallMilestoneRequiredTitleRule implements PaywallMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallMilestone): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallMilestoneTitleLengthRule implements PaywallMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallMilestoneBudgetRangeRule implements PaywallMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallMilestone): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PaywallMilestoneAllowedSummaryRule implements PaywallMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PaywallMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is blocked`];
    return [];
  }
}

export class PaywallMilestoneSummaryLengthRule implements PaywallMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallMilestone): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallMilestoneCodePrefixRule implements PaywallMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PaywallMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a paywall milestone. */
export class PaywallMilestoneValidator {
  rules: PaywallMilestoneRule[];

  constructor(rules: PaywallMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallMilestone[]): Map<string, string[]> {
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

export function defaultPaywallMilestoneValidator(): PaywallMilestoneValidator {
  return new PaywallMilestoneValidator(
    [
      new PaywallMilestoneRequiredTitleRule("paywall milestone needs a value"),
      new PaywallMilestoneTitleLengthRule(32),
      new PaywallMilestoneBudgetRangeRule(8.9, 4904.7),
      new PaywallMilestoneAllowedSummaryRule(["batched", "primary", "manual"]),
      new PaywallMilestoneSummaryLengthRule(16),
      new PaywallMilestoneCodePrefixRule("ACM"),
    ],
  );
}
