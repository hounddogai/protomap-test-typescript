import { ScheduledWindowNotice } from "./scheduled-window-notice.js";

/** A rule a scheduled window notice must pass. Check returns its problems, or none. */
export interface ScheduledWindowNoticeRule {
  check(item: ScheduledWindowNotice): string[];
}

export class ScheduledWindowNoticeCodeLengthRule implements ScheduledWindowNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledWindowNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledWindowNoticeRequiredNameRule implements ScheduledWindowNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledWindowNotice): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledWindowNoticeRequiredLabelRule implements ScheduledWindowNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledWindowNotice): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledWindowNoticeBudgetRangeRule implements ScheduledWindowNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledWindowNotice): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledWindowNoticeStartsAtRangeRule implements ScheduledWindowNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledWindowNotice): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledWindowNoticeLabelLengthRule implements ScheduledWindowNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledWindowNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled window notice. */
export class ScheduledWindowNoticeValidator {
  rules: ScheduledWindowNoticeRule[];

  constructor(rules: ScheduledWindowNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledWindowNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledWindowNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledWindowNotice[]): Map<string, string[]> {
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

export function defaultScheduledWindowNoticeValidator(): ScheduledWindowNoticeValidator {
  return new ScheduledWindowNoticeValidator(
    [
      new ScheduledWindowNoticeCodeLengthRule(120),
      new ScheduledWindowNoticeRequiredNameRule("scheduled window notice needs a value"),
      new ScheduledWindowNoticeRequiredLabelRule("scheduled window notice needs a value"),
      new ScheduledWindowNoticeBudgetRangeRule(8.4, 2899.7),
      new ScheduledWindowNoticeStartsAtRangeRule(80, 120),
      new ScheduledWindowNoticeLabelLengthRule(32),
    ],
  );
}
