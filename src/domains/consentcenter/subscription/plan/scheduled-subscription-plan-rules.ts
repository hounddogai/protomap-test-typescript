import * as text from "../../../../kit/text.js";
import { ScheduledSubscriptionPlan } from "./scheduled-subscription-plan.js";

/** A rule a scheduled subscription plan must pass. Check returns its problems, or none. */
export interface ScheduledSubscriptionPlanRule {
  check(item: ScheduledSubscriptionPlan): string[];
}

export class ScheduledSubscriptionPlanReviewerLengthRule implements ScheduledSubscriptionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSubscriptionPlan): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSubscriptionPlanNameLengthRule implements ScheduledSubscriptionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSubscriptionPlan): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSubscriptionPlanAllowedNameRule implements ScheduledSubscriptionPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledSubscriptionPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

export class ScheduledSubscriptionPlanTitleLengthRule implements ScheduledSubscriptionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSubscriptionPlan): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSubscriptionPlanCodeLengthRule implements ScheduledSubscriptionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSubscriptionPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled subscription plan. */
export class ScheduledSubscriptionPlanValidator {
  rules: ScheduledSubscriptionPlanRule[];

  constructor(rules: ScheduledSubscriptionPlanRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledSubscriptionPlan): string[] {
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

  requireValid(item: ScheduledSubscriptionPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledSubscriptionPlan[]): Map<string, string[]> {
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

export function defaultScheduledSubscriptionPlanValidator(): ScheduledSubscriptionPlanValidator {
  return new ScheduledSubscriptionPlanValidator(
    [
      new ScheduledSubscriptionPlanReviewerLengthRule(32),
      new ScheduledSubscriptionPlanNameLengthRule(64),
      new ScheduledSubscriptionPlanAllowedNameRule(["default", "primary", "primary"]),
      new ScheduledSubscriptionPlanTitleLengthRule(1000),
      new ScheduledSubscriptionPlanCodeLengthRule(16),
    ],
  );
}
