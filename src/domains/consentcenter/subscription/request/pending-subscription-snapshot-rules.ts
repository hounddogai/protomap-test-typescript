import * as text from "../../../../kit/text.js";
import { PendingSubscriptionSnapshot } from "./pending-subscription-snapshot.js";

/** A rule a pending subscription snapshot must pass. Check returns its problems, or none. */
export interface PendingSubscriptionSnapshotRule {
  check(item: PendingSubscriptionSnapshot): string[];
}

export class PendingSubscriptionSnapshotAllowedTitleRule implements PendingSubscriptionSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingSubscriptionSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

export class PendingSubscriptionSnapshotRequiredNameRule implements PendingSubscriptionSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSubscriptionSnapshot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSubscriptionSnapshotBudgetRangeRule implements PendingSubscriptionSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSubscriptionSnapshot): string[] {
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

export class PendingSubscriptionSnapshotTitleLengthRule implements PendingSubscriptionSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSubscriptionSnapshot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingSubscriptionSnapshotCodePrefixRule implements PendingSubscriptionSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingSubscriptionSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending subscription snapshot. */
export class PendingSubscriptionSnapshotValidator {
  rules: PendingSubscriptionSnapshotRule[];

  constructor(rules: PendingSubscriptionSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: PendingSubscriptionSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingSubscriptionSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingSubscriptionSnapshot[]): Map<string, string[]> {
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

export function defaultPendingSubscriptionSnapshotValidator(): PendingSubscriptionSnapshotValidator {
  return new PendingSubscriptionSnapshotValidator(
    [
      new PendingSubscriptionSnapshotAllowedTitleRule([]),
      new PendingSubscriptionSnapshotRequiredNameRule("pending subscription snapshot needs a value"),
      new PendingSubscriptionSnapshotBudgetRangeRule(6.3, 303.9),
      new PendingSubscriptionSnapshotTitleLengthRule(1000),
      new PendingSubscriptionSnapshotCodePrefixRule("OPS"),
    ],
  );
}
