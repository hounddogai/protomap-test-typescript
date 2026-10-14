import { PendingBidRuleNotice } from "./pending-bid-rule-notice.js";

/** A rule a pending bid rule notice must pass. Check returns its problems, or none. */
export interface PendingBidRuleNoticeRule {
  check(item: PendingBidRuleNotice): string[];
}

export class PendingBidRuleNoticeTitleLengthRule implements PendingBidRuleNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBidRuleNotice): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBidRuleNoticeLimitRangeRule implements PendingBidRuleNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBidRuleNotice): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingBidRuleNoticeNameLengthRule implements PendingBidRuleNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBidRuleNotice): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending bid rule notice. */
export class PendingBidRuleNoticeValidator {
  rules: PendingBidRuleNoticeRule[];

  constructor(rules: PendingBidRuleNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBidRuleNotice): string[] {
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

  requireValid(item: PendingBidRuleNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBidRuleNotice[]): Map<string, string[]> {
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

export function defaultPendingBidRuleNoticeValidator(): PendingBidRuleNoticeValidator {
  return new PendingBidRuleNoticeValidator(
    [
      new PendingBidRuleNoticeTitleLengthRule(32),
      new PendingBidRuleNoticeLimitRangeRule(80, 1000),
      new PendingBidRuleNoticeNameLengthRule(32),
    ],
  );
}
