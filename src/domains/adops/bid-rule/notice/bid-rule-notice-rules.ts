import * as text from "../../../../kit/text.js";
import { BidRuleNotice } from "./bid-rule-notice.js";

/** A rule a bid rule notice must pass. Check returns its problems, or none. */
export interface BidRuleNoticeRule {
  check(item: BidRuleNotice): string[];
}

export class BidRuleNoticeAllowedLabelRule implements BidRuleNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BidRuleNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is duplicated`];
    return [];
  }
}

export class BidRuleNoticeGraceDaysRangeRule implements BidRuleNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleNotice): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BidRuleNoticeRequiredLabelRule implements BidRuleNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleNotice): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bid rule notice. */
export class BidRuleNoticeValidator {
  rules: BidRuleNoticeRule[];

  constructor(rules: BidRuleNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleNotice[]): Map<string, string[]> {
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

export function defaultBidRuleNoticeValidator(): BidRuleNoticeValidator {
  return new BidRuleNoticeValidator(
    [
      new BidRuleNoticeAllowedLabelRule(["scheduled", "rolling"]),
      new BidRuleNoticeGraceDaysRangeRule(64, 86400),
      new BidRuleNoticeRequiredLabelRule("bid rule notice needs this field"),
    ],
  );
}
