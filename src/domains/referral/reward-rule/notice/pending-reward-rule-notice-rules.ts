import { PendingRewardRuleNotice } from "./pending-reward-rule-notice.js";

/** A rule a pending reward rule notice must pass. Check returns its problems, or none. */
export interface PendingRewardRuleNoticeRule {
  check(item: PendingRewardRuleNotice): string[];
}

export class PendingRewardRuleNoticeCodeLengthRule implements PendingRewardRuleNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRewardRuleNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingRewardRuleNoticeRequiredTitleRule implements PendingRewardRuleNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRewardRuleNotice): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingRewardRuleNoticeRequiredNameRule implements PendingRewardRuleNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRewardRuleNotice): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingRewardRuleNoticeRateRangeRule implements PendingRewardRuleNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingRewardRuleNotice): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingRewardRuleNoticeNameLengthRule implements PendingRewardRuleNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRewardRuleNotice): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingRewardRuleNoticeTitleLengthRule implements PendingRewardRuleNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRewardRuleNotice): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending reward rule notice. */
export class PendingRewardRuleNoticeValidator {
  rules: PendingRewardRuleNoticeRule[];

  constructor(rules: PendingRewardRuleNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: PendingRewardRuleNotice): string[] {
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

  requireValid(item: PendingRewardRuleNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingRewardRuleNotice[]): Map<string, string[]> {
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

export function defaultPendingRewardRuleNoticeValidator(): PendingRewardRuleNoticeValidator {
  return new PendingRewardRuleNoticeValidator(
    [
      new PendingRewardRuleNoticeCodeLengthRule(1000),
      new PendingRewardRuleNoticeRequiredTitleRule("pending reward rule notice needs a value"),
      new PendingRewardRuleNoticeRequiredNameRule("pending reward rule notice needs an entry"),
      new PendingRewardRuleNoticeRateRangeRule(4.6, 352.5),
      new PendingRewardRuleNoticeNameLengthRule(120),
      new PendingRewardRuleNoticeTitleLengthRule(255),
    ],
  );
}
