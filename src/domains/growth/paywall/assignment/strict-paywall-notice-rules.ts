import { StrictPaywallNotice } from "./strict-paywall-notice.js";

/** A rule a strict paywall notice must pass. Check returns its problems, or none. */
export interface StrictPaywallNoticeRule {
  check(item: StrictPaywallNotice): string[];
}

export class StrictPaywallNoticeMaximumRangeRule implements StrictPaywallNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPaywallNotice): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictPaywallNoticeTitleLengthRule implements StrictPaywallNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPaywallNotice): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPaywallNoticeOpenRateRangeRule implements StrictPaywallNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPaywallNotice): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictPaywallNoticeScoreRangeRule implements StrictPaywallNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPaywallNotice): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict paywall notice. */
export class StrictPaywallNoticeValidator {
  rules: StrictPaywallNoticeRule[];

  constructor(rules: StrictPaywallNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPaywallNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictPaywallNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPaywallNotice[]): Map<string, string[]> {
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

export function defaultStrictPaywallNoticeValidator(): StrictPaywallNoticeValidator {
  return new StrictPaywallNoticeValidator(
    [
      new StrictPaywallNoticeMaximumRangeRule(8.1, 404.1),
      new StrictPaywallNoticeTitleLengthRule(64),
      new StrictPaywallNoticeOpenRateRangeRule(3.7, 2702.8),
      new StrictPaywallNoticeScoreRangeRule(8.1, 2826.5),
    ],
  );
}
