import { NudgeNotice } from "./nudge-notice.js";

/** A rule a nudge notice must pass. Check returns its problems, or none. */
export interface NudgeNoticeRule {
  check(item: NudgeNotice): string[];
}

export class NudgeNoticeRequiredTitleRule implements NudgeNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeNotice): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeNoticeThresholdRangeRule implements NudgeNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeNotice): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class NudgeNoticeMinimumRangeRule implements NudgeNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeNotice): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class NudgeNoticeTitleLengthRule implements NudgeNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeNotice): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeNoticeRequiredCodeRule implements NudgeNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a nudge notice. */
export class NudgeNoticeValidator {
  rules: NudgeNoticeRule[];

  constructor(rules: NudgeNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeNotice): string[] {
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

  requireValid(item: NudgeNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeNotice[]): Map<string, string[]> {
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

export function defaultNudgeNoticeValidator(): NudgeNoticeValidator {
  return new NudgeNoticeValidator(
    [
      new NudgeNoticeRequiredTitleRule("nudge notice needs this field"),
      new NudgeNoticeThresholdRangeRule(8.3, 4121.1),
      new NudgeNoticeMinimumRangeRule(0.2, 2570.4),
      new NudgeNoticeTitleLengthRule(255),
      new NudgeNoticeRequiredCodeRule("nudge notice needs an entry"),
    ],
  );
}
