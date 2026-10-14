import { GlobalBidRuleNotice } from "./global-bid-rule-notice.js";

/** A rule a global bid rule notice must pass. Check returns its problems, or none. */
export interface GlobalBidRuleNoticeRule {
  check(item: GlobalBidRuleNotice): string[];
}

export class GlobalBidRuleNoticeBidRangeRule implements GlobalBidRuleNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalBidRuleNotice): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalBidRuleNoticeRateRangeRule implements GlobalBidRuleNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalBidRuleNotice): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalBidRuleNoticeMaximumRangeRule implements GlobalBidRuleNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalBidRuleNotice): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a global bid rule notice. */
export class GlobalBidRuleNoticeValidator {
  rules: GlobalBidRuleNoticeRule[];

  constructor(rules: GlobalBidRuleNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalBidRuleNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalBidRuleNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalBidRuleNotice[]): Map<string, string[]> {
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

export function defaultGlobalBidRuleNoticeValidator(): GlobalBidRuleNoticeValidator {
  return new GlobalBidRuleNoticeValidator(
    [
      new GlobalBidRuleNoticeBidRangeRule(2.8, 2824.9),
      new GlobalBidRuleNoticeRateRangeRule(0.1, 660.3),
      new GlobalBidRuleNoticeMaximumRangeRule(4.2, 3449.8),
    ],
  );
}
