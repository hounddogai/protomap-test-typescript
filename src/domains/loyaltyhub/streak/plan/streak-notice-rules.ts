import { StreakNotice } from "./streak-notice.js";

/** A rule a streak notice must pass. Check returns its problems, or none. */
export interface StreakNoticeRule {
  check(item: StreakNotice): string[];
}

export class StreakNoticeRequiredCodeRule implements StreakNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StreakNoticeLabelLengthRule implements StreakNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakNoticeRetriesRangeRule implements StreakNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakNotice): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a streak notice. */
export class StreakNoticeValidator {
  rules: StreakNoticeRule[];

  constructor(rules: StreakNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: StreakNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StreakNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakNotice[]): Map<string, string[]> {
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

export function defaultStreakNoticeValidator(): StreakNoticeValidator {
  return new StreakNoticeValidator(
    [
      new StreakNoticeRequiredCodeRule("streak notice needs an entry"),
      new StreakNoticeLabelLengthRule(3600),
      new StreakNoticeRetriesRangeRule(120, 86400),
    ],
  );
}
