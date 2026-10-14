import { ScheduledBidRuleNotice } from "./scheduled-bid-rule-notice.js";

/** A rule a scheduled bid rule notice must pass. Check returns its problems, or none. */
export interface ScheduledBidRuleNoticeRule {
  check(item: ScheduledBidRuleNotice): string[];
}

export class ScheduledBidRuleNoticeLabelLengthRule implements ScheduledBidRuleNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledBidRuleNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledBidRuleNoticePriorityRangeRule implements ScheduledBidRuleNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledBidRuleNotice): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledBidRuleNoticeRequiredAudienceIdRule implements ScheduledBidRuleNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledBidRuleNotice): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled bid rule notice. */
export class ScheduledBidRuleNoticeValidator {
  rules: ScheduledBidRuleNoticeRule[];

  constructor(rules: ScheduledBidRuleNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledBidRuleNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledBidRuleNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledBidRuleNotice[]): Map<string, string[]> {
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

export function defaultScheduledBidRuleNoticeValidator(): ScheduledBidRuleNoticeValidator {
  return new ScheduledBidRuleNoticeValidator(
    [
      new ScheduledBidRuleNoticeLabelLengthRule(32),
      new ScheduledBidRuleNoticePriorityRangeRule(16, 3600),
      new ScheduledBidRuleNoticeRequiredAudienceIdRule("scheduled bid rule notice needs a value"),
    ],
  );
}
