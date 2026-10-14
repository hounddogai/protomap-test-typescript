import * as text from "../../../../kit/text.js";
import { ScheduledPayoutNotice } from "./scheduled-payout-notice.js";

/** A rule a scheduled payout notice must pass. Check returns its problems, or none. */
export interface ScheduledPayoutNoticeRule {
  check(item: ScheduledPayoutNotice): string[];
}

export class ScheduledPayoutNoticeRequiredLocaleRule implements ScheduledPayoutNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPayoutNotice): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPayoutNoticeLimitRangeRule implements ScheduledPayoutNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledPayoutNotice): string[] {
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

export class ScheduledPayoutNoticeCampaignRefLengthRule implements ScheduledPayoutNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPayoutNotice): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPayoutNoticeRequiredCampaignRefRule implements ScheduledPayoutNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPayoutNotice): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPayoutNoticeCodePrefixRule implements ScheduledPayoutNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledPayoutNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledPayoutNoticeAllowedTitleRule implements ScheduledPayoutNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledPayoutNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

/** Runs every rule of a scheduled payout notice. */
export class ScheduledPayoutNoticeValidator {
  rules: ScheduledPayoutNoticeRule[];

  constructor(rules: ScheduledPayoutNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPayoutNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledPayoutNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPayoutNotice[]): Map<string, string[]> {
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

export function defaultScheduledPayoutNoticeValidator(): ScheduledPayoutNoticeValidator {
  return new ScheduledPayoutNoticeValidator(
    [
      new ScheduledPayoutNoticeRequiredLocaleRule("scheduled payout notice needs an entry"),
      new ScheduledPayoutNoticeLimitRangeRule(255, 3600),
      new ScheduledPayoutNoticeCampaignRefLengthRule(3600),
      new ScheduledPayoutNoticeRequiredCampaignRefRule("scheduled payout notice needs an entry"),
      new ScheduledPayoutNoticeCodePrefixRule("Q"),
      new ScheduledPayoutNoticeAllowedTitleRule(["legacy", "manual", "fallback"]),
    ],
  );
}
