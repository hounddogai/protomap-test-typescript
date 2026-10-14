import { MentionNotice } from "./mention-notice.js";

/** A rule a mention notice must pass. Check returns its problems, or none. */
export interface MentionNoticeRule {
  check(item: MentionNotice): string[];
}

export class MentionNoticeCodeLengthRule implements MentionNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionNoticeTimezoneLengthRule implements MentionNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionNotice): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionNoticeRequiredCodeRule implements MentionNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MentionNoticeWindowDaysRangeRule implements MentionNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionNotice): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a mention notice. */
export class MentionNoticeValidator {
  rules: MentionNoticeRule[];

  constructor(rules: MentionNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: MentionNotice): string[] {
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

  requireValid(item: MentionNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionNotice[]): Map<string, string[]> {
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

export function defaultMentionNoticeValidator(): MentionNoticeValidator {
  return new MentionNoticeValidator(
    [
      new MentionNoticeCodeLengthRule(80),
      new MentionNoticeTimezoneLengthRule(80),
      new MentionNoticeRequiredCodeRule("mention notice needs a value"),
      new MentionNoticeWindowDaysRangeRule(1000, 86400),
    ],
  );
}
