import { PendingSubscriptionThreshold } from "./pending-subscription-threshold.js";

/** A rule a pending subscription threshold must pass. Check returns its problems, or none. */
export interface PendingSubscriptionThresholdRule {
  check(item: PendingSubscriptionThreshold): string[];
}

export class PendingSubscriptionThresholdRequiredReviewerRule implements PendingSubscriptionThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSubscriptionThreshold): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSubscriptionThresholdRequiredTitleRule implements PendingSubscriptionThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSubscriptionThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSubscriptionThresholdReviewerLengthRule implements PendingSubscriptionThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSubscriptionThreshold): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingSubscriptionThresholdRequiredNotesRule implements PendingSubscriptionThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSubscriptionThreshold): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSubscriptionThresholdTitleLengthRule implements PendingSubscriptionThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSubscriptionThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending subscription threshold. */
export class PendingSubscriptionThresholdValidator {
  rules: PendingSubscriptionThresholdRule[];

  constructor(rules: PendingSubscriptionThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: PendingSubscriptionThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingSubscriptionThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingSubscriptionThreshold[]): Map<string, string[]> {
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

export function defaultPendingSubscriptionThresholdValidator(): PendingSubscriptionThresholdValidator {
  return new PendingSubscriptionThresholdValidator(
    [
      new PendingSubscriptionThresholdRequiredReviewerRule("pending subscription threshold needs a value"),
      new PendingSubscriptionThresholdRequiredTitleRule("pending subscription threshold needs an entry"),
      new PendingSubscriptionThresholdReviewerLengthRule(3600),
      new PendingSubscriptionThresholdRequiredNotesRule("pending subscription threshold needs an entry"),
      new PendingSubscriptionThresholdTitleLengthRule(80),
    ],
  );
}
