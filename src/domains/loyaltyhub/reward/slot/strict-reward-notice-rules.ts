import { StrictRewardNotice } from "./strict-reward-notice.js";

/** A rule a strict reward notice must pass. Check returns its problems, or none. */
export interface StrictRewardNoticeRule {
  check(item: StrictRewardNotice): string[];
}

export class StrictRewardNoticeActiveGuardRule implements StrictRewardNoticeRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictRewardNotice): string[] {
    if (item.active && item.rate > this.limit) return [`rate ${item.rate} exceeds ${this.limit} while active`];
    return [];
  }
}

export class StrictRewardNoticeRequiredTitleRule implements StrictRewardNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRewardNotice): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRewardNoticeRateRangeRule implements StrictRewardNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRewardNotice): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictRewardNoticeRequiredAudienceIdRule implements StrictRewardNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRewardNotice): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRewardNoticeTitleLengthRule implements StrictRewardNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRewardNotice): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRewardNoticeCodePrefixRule implements StrictRewardNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictRewardNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict reward notice. */
export class StrictRewardNoticeValidator {
  rules: StrictRewardNoticeRule[];

  constructor(rules: StrictRewardNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: StrictRewardNotice): string[] {
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

  requireValid(item: StrictRewardNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictRewardNotice[]): Map<string, string[]> {
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

export function defaultStrictRewardNoticeValidator(): StrictRewardNoticeValidator {
  return new StrictRewardNoticeValidator(
    [
      new StrictRewardNoticeActiveGuardRule(5),
      new StrictRewardNoticeRequiredTitleRule("strict reward notice needs this field"),
      new StrictRewardNoticeRateRangeRule(8.6, 2659.4),
      new StrictRewardNoticeRequiredAudienceIdRule("strict reward notice needs an entry"),
      new StrictRewardNoticeTitleLengthRule(1000),
      new StrictRewardNoticeCodePrefixRule("ACM"),
    ],
  );
}
