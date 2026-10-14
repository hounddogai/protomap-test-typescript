import * as text from "../../../../kit/text.js";
import { ScheduledReplyClaim } from "./scheduled-reply-claim.js";

/** A rule a scheduled reply claim must pass. Check returns its problems, or none. */
export interface ScheduledReplyClaimRule {
  check(item: ScheduledReplyClaim): string[];
}

export class ScheduledReplyClaimRequiredReviewerRule implements ScheduledReplyClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledReplyClaim): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledReplyClaimAllowedLabelRule implements ScheduledReplyClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledReplyClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is stale`];
    return [];
  }
}

export class ScheduledReplyClaimCeilingRangeRule implements ScheduledReplyClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledReplyClaim): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledReplyClaimLabelLengthRule implements ScheduledReplyClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledReplyClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled reply claim. */
export class ScheduledReplyClaimValidator {
  rules: ScheduledReplyClaimRule[];

  constructor(rules: ScheduledReplyClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledReplyClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledReplyClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledReplyClaim[]): Map<string, string[]> {
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

export function defaultScheduledReplyClaimValidator(): ScheduledReplyClaimValidator {
  return new ScheduledReplyClaimValidator(
    [
      new ScheduledReplyClaimRequiredReviewerRule("scheduled reply claim needs this field"),
      new ScheduledReplyClaimAllowedLabelRule(["weighted", "scheduled"]),
      new ScheduledReplyClaimCeilingRangeRule(9.4, 2804.2),
      new ScheduledReplyClaimLabelLengthRule(16),
    ],
  );
}
