import { SubscriptionNotice } from "./subscription-notice.js";

/** A rule a subscription notice must pass. Check returns its problems, or none. */
export interface SubscriptionNoticeRule {
  check(item: SubscriptionNotice): string[];
}

export class SubscriptionNoticeSequenceRangeRule implements SubscriptionNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionNotice): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionNoticeRegionLengthRule implements SubscriptionNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionNotice): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionNoticeRequiredLocaleRule implements SubscriptionNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionNotice): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionNoticeRequiredRegionRule implements SubscriptionNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionNotice): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionNoticeRequiredTitleRule implements SubscriptionNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionNotice): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a subscription notice. */
export class SubscriptionNoticeValidator {
  rules: SubscriptionNoticeRule[];

  constructor(rules: SubscriptionNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionNotice): string[] {
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

  requireValid(item: SubscriptionNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionNotice[]): Map<string, string[]> {
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

export function defaultSubscriptionNoticeValidator(): SubscriptionNoticeValidator {
  return new SubscriptionNoticeValidator(
    [
      new SubscriptionNoticeSequenceRangeRule(64, 120),
      new SubscriptionNoticeRegionLengthRule(86400),
      new SubscriptionNoticeRequiredLocaleRule("subscription notice needs a value"),
      new SubscriptionNoticeRequiredRegionRule("subscription notice needs an entry"),
      new SubscriptionNoticeRequiredTitleRule("subscription notice needs this field"),
    ],
  );
}
