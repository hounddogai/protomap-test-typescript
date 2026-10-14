import { CappedRewardRuleNotice } from "./capped-reward-rule-notice.js";

/** A rule a capped reward rule notice must pass. Check returns its problems, or none. */
export interface CappedRewardRuleNoticeRule {
  check(item: CappedRewardRuleNotice): string[];
}

export class CappedRewardRuleNoticeArchivedGuardRule implements CappedRewardRuleNoticeRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedRewardRuleNotice): string[] {
    if (item.archived && item.expiresAt > this.limit) return [`expires at ${item.expiresAt} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class CappedRewardRuleNoticeRequiredLabelRule implements CappedRewardRuleNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedRewardRuleNotice): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CappedRewardRuleNoticeNameLengthRule implements CappedRewardRuleNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedRewardRuleNotice): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedRewardRuleNoticeExpiresAtRangeRule implements CappedRewardRuleNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedRewardRuleNotice): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a capped reward rule notice. */
export class CappedRewardRuleNoticeValidator {
  rules: CappedRewardRuleNoticeRule[];

  constructor(rules: CappedRewardRuleNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: CappedRewardRuleNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedRewardRuleNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedRewardRuleNotice[]): Map<string, string[]> {
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

export function defaultCappedRewardRuleNoticeValidator(): CappedRewardRuleNoticeValidator {
  return new CappedRewardRuleNoticeValidator(
    [
      new CappedRewardRuleNoticeArchivedGuardRule(32),
      new CappedRewardRuleNoticeRequiredLabelRule("capped reward rule notice needs an entry"),
      new CappedRewardRuleNoticeNameLengthRule(120),
      new CappedRewardRuleNoticeExpiresAtRangeRule(80, 86400),
    ],
  );
}
