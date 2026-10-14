import { PendingConversionNotice } from "./pending-conversion-notice.js";

/** A rule a pending conversion notice must pass. Check returns its problems, or none. */
export interface PendingConversionNoticeRule {
  check(item: PendingConversionNotice): string[];
}

export class PendingConversionNoticeRequiredCodeRule implements PendingConversionNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingConversionNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingConversionNoticeRequiredSegmentRule implements PendingConversionNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingConversionNotice): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class PendingConversionNoticeMaximumRangeRule implements PendingConversionNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingConversionNotice): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingConversionNoticeTitleLengthRule implements PendingConversionNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingConversionNotice): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingConversionNoticeScoreRangeRule implements PendingConversionNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingConversionNotice): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingConversionNoticeRequiredTitleRule implements PendingConversionNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingConversionNotice): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending conversion notice. */
export class PendingConversionNoticeValidator {
  rules: PendingConversionNoticeRule[];

  constructor(rules: PendingConversionNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: PendingConversionNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingConversionNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingConversionNotice[]): Map<string, string[]> {
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

export function defaultPendingConversionNoticeValidator(): PendingConversionNoticeValidator {
  return new PendingConversionNoticeValidator(
    [
      new PendingConversionNoticeRequiredCodeRule("pending conversion notice needs an entry"),
      new PendingConversionNoticeRequiredSegmentRule("pending conversion notice needs an entry"),
      new PendingConversionNoticeMaximumRangeRule(8.3, 3323.4),
      new PendingConversionNoticeTitleLengthRule(86400),
      new PendingConversionNoticeScoreRangeRule(4.1, 2185.9),
      new PendingConversionNoticeRequiredTitleRule("pending conversion notice needs a value"),
    ],
  );
}
