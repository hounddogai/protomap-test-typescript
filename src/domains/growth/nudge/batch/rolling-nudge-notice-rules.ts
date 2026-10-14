import { RollingNudgeNotice } from "./rolling-nudge-notice.js";

/** A rule a rolling nudge notice must pass. Check returns its problems, or none. */
export interface RollingNudgeNoticeRule {
  check(item: RollingNudgeNotice): string[];
}

export class RollingNudgeNoticeMarginRangeRule implements RollingNudgeNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingNudgeNotice): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingNudgeNoticePhoneLengthRule implements RollingNudgeNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingNudgeNotice): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingNudgeNoticeRequiredCodeRule implements RollingNudgeNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingNudgeNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling nudge notice. */
export class RollingNudgeNoticeValidator {
  rules: RollingNudgeNoticeRule[];

  constructor(rules: RollingNudgeNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: RollingNudgeNotice): string[] {
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

  requireValid(item: RollingNudgeNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingNudgeNotice[]): Map<string, string[]> {
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

export function defaultRollingNudgeNoticeValidator(): RollingNudgeNoticeValidator {
  return new RollingNudgeNoticeValidator(
    [
      new RollingNudgeNoticeMarginRangeRule(0.1, 4507.2),
      new RollingNudgeNoticePhoneLengthRule(32),
      new RollingNudgeNoticeRequiredCodeRule("rolling nudge notice needs this field"),
    ],
  );
}
