import { LenientBounceNotice } from "./lenient-bounce-notice.js";

/** A rule a lenient bounce notice must pass. Check returns its problems, or none. */
export interface LenientBounceNoticeRule {
  check(item: LenientBounceNotice): string[];
}

export class LenientBounceNoticeOwnerIdLengthRule implements LenientBounceNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBounceNotice): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientBounceNoticeRevisionRangeRule implements LenientBounceNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientBounceNotice): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientBounceNoticeRequiredOwnerIdRule implements LenientBounceNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBounceNotice): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class LenientBounceNoticeRequiredVariantRule implements LenientBounceNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBounceNotice): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient bounce notice. */
export class LenientBounceNoticeValidator {
  rules: LenientBounceNoticeRule[];

  constructor(rules: LenientBounceNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: LenientBounceNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientBounceNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientBounceNotice[]): Map<string, string[]> {
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

export function defaultLenientBounceNoticeValidator(): LenientBounceNoticeValidator {
  return new LenientBounceNoticeValidator(
    [
      new LenientBounceNoticeOwnerIdLengthRule(64),
      new LenientBounceNoticeRevisionRangeRule(16, 3600),
      new LenientBounceNoticeRequiredOwnerIdRule("lenient bounce notice needs a value"),
      new LenientBounceNoticeRequiredVariantRule("lenient bounce notice needs this field"),
    ],
  );
}
