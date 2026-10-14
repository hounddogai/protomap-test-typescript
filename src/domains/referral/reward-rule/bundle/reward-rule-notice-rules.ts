import { RewardRuleNotice } from "./reward-rule-notice.js";

/** A rule a reward rule notice must pass. Check returns its problems, or none. */
export interface RewardRuleNoticeRule {
  check(item: RewardRuleNotice): string[];
}

export class RewardRuleNoticeWeightRangeRule implements RewardRuleNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleNotice): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardRuleNoticeRequiredLocaleRule implements RewardRuleNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleNotice): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleNoticeLocaleLengthRule implements RewardRuleNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleNotice): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleNoticeRequiredCodeRule implements RewardRuleNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleNoticeRequiredUtmSourceRule implements RewardRuleNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleNotice): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleNoticeNameLengthRule implements RewardRuleNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleNotice): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward rule notice. */
export class RewardRuleNoticeValidator {
  rules: RewardRuleNoticeRule[];

  constructor(rules: RewardRuleNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleNotice[]): Map<string, string[]> {
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

export function defaultRewardRuleNoticeValidator(): RewardRuleNoticeValidator {
  return new RewardRuleNoticeValidator(
    [
      new RewardRuleNoticeWeightRangeRule(6.1, 3616.6),
      new RewardRuleNoticeRequiredLocaleRule("reward rule notice needs this field"),
      new RewardRuleNoticeLocaleLengthRule(255),
      new RewardRuleNoticeRequiredCodeRule("reward rule notice needs this field"),
      new RewardRuleNoticeRequiredUtmSourceRule("reward rule notice needs this field"),
      new RewardRuleNoticeNameLengthRule(3600),
    ],
  );
}
