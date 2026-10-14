import * as text from "../../../../kit/text.js";
import { LenientSenderNotice } from "./lenient-sender-notice.js";

/** A rule a lenient sender notice must pass. Check returns its problems, or none. */
export interface LenientSenderNoticeRule {
  check(item: LenientSenderNotice): string[];
}

export class LenientSenderNoticeRequiredCodeRule implements LenientSenderNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientSenderNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientSenderNoticeLabelLengthRule implements LenientSenderNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientSenderNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientSenderNoticeRateRangeRule implements LenientSenderNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientSenderNotice): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientSenderNoticeAllowedTitleRule implements LenientSenderNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientSenderNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

export class LenientSenderNoticeTitleLengthRule implements LenientSenderNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientSenderNotice): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientSenderNoticeSequenceRangeRule implements LenientSenderNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientSenderNotice): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient sender notice. */
export class LenientSenderNoticeValidator {
  rules: LenientSenderNoticeRule[];

  constructor(rules: LenientSenderNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: LenientSenderNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientSenderNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientSenderNotice[]): Map<string, string[]> {
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

export function defaultLenientSenderNoticeValidator(): LenientSenderNoticeValidator {
  return new LenientSenderNoticeValidator(
    [
      new LenientSenderNoticeRequiredCodeRule("lenient sender notice needs a value"),
      new LenientSenderNoticeLabelLengthRule(120),
      new LenientSenderNoticeRateRangeRule(5.3, 4109.1),
      new LenientSenderNoticeAllowedTitleRule(["default", "rolling"]),
      new LenientSenderNoticeTitleLengthRule(32),
      new LenientSenderNoticeSequenceRangeRule(32, 120),
    ],
  );
}
