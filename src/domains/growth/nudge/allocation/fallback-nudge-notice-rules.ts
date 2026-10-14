import { FallbackNudgeNotice } from "./fallback-nudge-notice.js";

/** A rule a fallback nudge notice must pass. Check returns its problems, or none. */
export interface FallbackNudgeNoticeRule {
  check(item: FallbackNudgeNotice): string[];
}

export class FallbackNudgeNoticeTitleLengthRule implements FallbackNudgeNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackNudgeNotice): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackNudgeNoticeUnitLengthRule implements FallbackNudgeNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackNudgeNotice): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackNudgeNoticeImpressionsRangeRule implements FallbackNudgeNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackNudgeNotice): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a fallback nudge notice. */
export class FallbackNudgeNoticeValidator {
  rules: FallbackNudgeNoticeRule[];

  constructor(rules: FallbackNudgeNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackNudgeNotice): string[] {
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

  requireValid(item: FallbackNudgeNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackNudgeNotice[]): Map<string, string[]> {
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

export function defaultFallbackNudgeNoticeValidator(): FallbackNudgeNoticeValidator {
  return new FallbackNudgeNoticeValidator(
    [
      new FallbackNudgeNoticeTitleLengthRule(255),
      new FallbackNudgeNoticeUnitLengthRule(16),
      new FallbackNudgeNoticeImpressionsRangeRule(1000, 86400),
    ],
  );
}
