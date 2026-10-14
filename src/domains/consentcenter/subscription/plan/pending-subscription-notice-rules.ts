import { PendingSubscriptionNotice } from "./pending-subscription-notice.js";

/** A rule a pending subscription notice must pass. Check returns its problems, or none. */
export interface PendingSubscriptionNoticeRule {
  check(item: PendingSubscriptionNotice): string[];
}

export class PendingSubscriptionNoticeGraceDaysRangeRule implements PendingSubscriptionNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSubscriptionNotice): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingSubscriptionNoticeUtmSourceLengthRule implements PendingSubscriptionNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSubscriptionNotice): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingSubscriptionNoticeScoreRangeRule implements PendingSubscriptionNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSubscriptionNotice): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingSubscriptionNoticeRequiredUtmSourceRule implements PendingSubscriptionNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSubscriptionNotice): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSubscriptionNoticeQuantityRangeRule implements PendingSubscriptionNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSubscriptionNotice): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending subscription notice. */
export class PendingSubscriptionNoticeValidator {
  rules: PendingSubscriptionNoticeRule[];

  constructor(rules: PendingSubscriptionNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: PendingSubscriptionNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingSubscriptionNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingSubscriptionNotice[]): Map<string, string[]> {
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

export function defaultPendingSubscriptionNoticeValidator(): PendingSubscriptionNoticeValidator {
  return new PendingSubscriptionNoticeValidator(
    [
      new PendingSubscriptionNoticeGraceDaysRangeRule(16, 64),
      new PendingSubscriptionNoticeUtmSourceLengthRule(32),
      new PendingSubscriptionNoticeScoreRangeRule(2.6, 2725.9),
      new PendingSubscriptionNoticeRequiredUtmSourceRule("pending subscription notice needs a value"),
      new PendingSubscriptionNoticeQuantityRangeRule(16, 16),
    ],
  );
}
