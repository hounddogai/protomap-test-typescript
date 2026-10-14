import { LenientSlaNotice } from "./lenient-sla-notice.js";

/** A rule a lenient sla notice must pass. Check returns its problems, or none. */
export interface LenientSlaNoticeRule {
  check(item: LenientSlaNotice): string[];
}

export class LenientSlaNoticeRequiredNotesRule implements LenientSlaNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientSlaNotice): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class LenientSlaNoticeCodeLengthRule implements LenientSlaNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientSlaNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientSlaNoticeUpdatedAtRangeRule implements LenientSlaNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientSlaNotice): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientSlaNoticeNotesLengthRule implements LenientSlaNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientSlaNotice): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientSlaNoticeNameLengthRule implements LenientSlaNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientSlaNotice): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient sla notice. */
export class LenientSlaNoticeValidator {
  rules: LenientSlaNoticeRule[];

  constructor(rules: LenientSlaNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: LenientSlaNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientSlaNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientSlaNotice[]): Map<string, string[]> {
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

export function defaultLenientSlaNoticeValidator(): LenientSlaNoticeValidator {
  return new LenientSlaNoticeValidator(
    [
      new LenientSlaNoticeRequiredNotesRule("lenient sla notice needs an entry"),
      new LenientSlaNoticeCodeLengthRule(255),
      new LenientSlaNoticeUpdatedAtRangeRule(64, 255),
      new LenientSlaNoticeNotesLengthRule(80),
      new LenientSlaNoticeNameLengthRule(80),
    ],
  );
}
