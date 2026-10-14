import { LegacyNudgeNotice } from "./legacy-nudge-notice.js";

/** A rule a legacy nudge notice must pass. Check returns its problems, or none. */
export interface LegacyNudgeNoticeRule {
  check(item: LegacyNudgeNotice): string[];
}

export class LegacyNudgeNoticeConversionRateRangeRule implements LegacyNudgeNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyNudgeNotice): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyNudgeNoticeChannelLengthRule implements LegacyNudgeNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyNudgeNotice): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyNudgeNoticeRequiredReviewerRule implements LegacyNudgeNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyNudgeNotice): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyNudgeNoticeUpdatedAtRangeRule implements LegacyNudgeNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyNudgeNotice): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyNudgeNoticePinnedGuardRule implements LegacyNudgeNoticeRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyNudgeNotice): string[] {
    if (item.pinned && item.conversionRate > this.limit) return [`conversion rate ${item.conversionRate} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class LegacyNudgeNoticeCodeLengthRule implements LegacyNudgeNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyNudgeNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy nudge notice. */
export class LegacyNudgeNoticeValidator {
  rules: LegacyNudgeNoticeRule[];

  constructor(rules: LegacyNudgeNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyNudgeNotice): string[] {
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

  requireValid(item: LegacyNudgeNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyNudgeNotice[]): Map<string, string[]> {
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

export function defaultLegacyNudgeNoticeValidator(): LegacyNudgeNoticeValidator {
  return new LegacyNudgeNoticeValidator(
    [
      new LegacyNudgeNoticeConversionRateRangeRule(2.3, 3298.7),
      new LegacyNudgeNoticeChannelLengthRule(64),
      new LegacyNudgeNoticeRequiredReviewerRule("legacy nudge notice needs this field"),
      new LegacyNudgeNoticeUpdatedAtRangeRule(64, 64),
      new LegacyNudgeNoticePinnedGuardRule(6.9),
      new LegacyNudgeNoticeCodeLengthRule(86400),
    ],
  );
}
