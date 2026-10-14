import { LenientQueueNotice } from "./lenient-queue-notice.js";

/** A rule a lenient queue notice must pass. Check returns its problems, or none. */
export interface LenientQueueNoticeRule {
  check(item: LenientQueueNotice): string[];
}

export class LenientQueueNoticeLabelLengthRule implements LenientQueueNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientQueueNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientQueueNoticeRequiredCodeRule implements LenientQueueNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientQueueNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientQueueNoticeRequiredLabelRule implements LenientQueueNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientQueueNotice): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient queue notice. */
export class LenientQueueNoticeValidator {
  rules: LenientQueueNoticeRule[];

  constructor(rules: LenientQueueNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: LenientQueueNotice): string[] {
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

  requireValid(item: LenientQueueNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientQueueNotice[]): Map<string, string[]> {
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

export function defaultLenientQueueNoticeValidator(): LenientQueueNoticeValidator {
  return new LenientQueueNoticeValidator(
    [
      new LenientQueueNoticeLabelLengthRule(64),
      new LenientQueueNoticeRequiredCodeRule("lenient queue notice needs an entry"),
      new LenientQueueNoticeRequiredLabelRule("lenient queue notice needs an entry"),
    ],
  );
}
