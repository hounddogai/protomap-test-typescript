import { RewardNotice } from "./reward-notice.js";

/** A rule a reward notice must pass. Check returns its problems, or none. */
export interface RewardNoticeRule {
  check(item: RewardNotice): string[];
}

export class RewardNoticeLabelLengthRule implements RewardNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardNoticeCodePrefixRule implements RewardNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardNoticeMaximumRangeRule implements RewardNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardNotice): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardNoticeChecksumLengthRule implements RewardNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardNotice): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardNoticeUnitLengthRule implements RewardNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardNotice): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardNoticeAttemptsRangeRule implements RewardNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardNotice): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a reward notice. */
export class RewardNoticeValidator {
  rules: RewardNoticeRule[];

  constructor(rules: RewardNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: RewardNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardNotice[]): Map<string, string[]> {
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

export function defaultRewardNoticeValidator(): RewardNoticeValidator {
  return new RewardNoticeValidator(
    [
      new RewardNoticeLabelLengthRule(1000),
      new RewardNoticeCodePrefixRule("X"),
      new RewardNoticeMaximumRangeRule(6.7, 2451.7),
      new RewardNoticeChecksumLengthRule(64),
      new RewardNoticeUnitLengthRule(86400),
      new RewardNoticeAttemptsRangeRule(64, 86400),
    ],
  );
}
