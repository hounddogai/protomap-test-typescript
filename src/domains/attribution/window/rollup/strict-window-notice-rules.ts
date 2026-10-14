import { StrictWindowNotice } from "./strict-window-notice.js";

/** A rule a strict window notice must pass. Check returns its problems, or none. */
export interface StrictWindowNoticeRule {
  check(item: StrictWindowNotice): string[];
}

export class StrictWindowNoticeNotesLengthRule implements StrictWindowNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictWindowNotice): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictWindowNoticeRequiredCodeRule implements StrictWindowNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictWindowNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictWindowNoticeLabelLengthRule implements StrictWindowNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictWindowNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictWindowNoticeRequiredLabelRule implements StrictWindowNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictWindowNotice): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StrictWindowNoticeMaximumRangeRule implements StrictWindowNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictWindowNotice): string[] {
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

export class StrictWindowNoticeRequiredNotesRule implements StrictWindowNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictWindowNotice): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict window notice. */
export class StrictWindowNoticeValidator {
  rules: StrictWindowNoticeRule[];

  constructor(rules: StrictWindowNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: StrictWindowNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictWindowNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictWindowNotice[]): Map<string, string[]> {
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

export function defaultStrictWindowNoticeValidator(): StrictWindowNoticeValidator {
  return new StrictWindowNoticeValidator(
    [
      new StrictWindowNoticeNotesLengthRule(3600),
      new StrictWindowNoticeRequiredCodeRule("strict window notice needs this field"),
      new StrictWindowNoticeLabelLengthRule(1000),
      new StrictWindowNoticeRequiredLabelRule("strict window notice needs an entry"),
      new StrictWindowNoticeMaximumRangeRule(5.3, 3866.7),
      new StrictWindowNoticeRequiredNotesRule("strict window notice needs a value"),
    ],
  );
}
