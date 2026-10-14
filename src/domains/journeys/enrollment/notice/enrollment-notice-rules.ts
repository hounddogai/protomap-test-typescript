import { EnrollmentNotice } from "./enrollment-notice.js";

/** A rule a enrollment notice must pass. Check returns its problems, or none. */
export interface EnrollmentNoticeRule {
  check(item: EnrollmentNotice): string[];
}

export class EnrollmentNoticeVariantLengthRule implements EnrollmentNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentNotice): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentNoticeVisibleGuardRule implements EnrollmentNoticeRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: EnrollmentNotice): string[] {
    if (item.visible && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class EnrollmentNoticeCodeLengthRule implements EnrollmentNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentNoticePriorityRangeRule implements EnrollmentNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentNotice): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EnrollmentNoticeCodePrefixRule implements EnrollmentNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a enrollment notice. */
export class EnrollmentNoticeValidator {
  rules: EnrollmentNoticeRule[];

  constructor(rules: EnrollmentNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentNotice[]): Map<string, string[]> {
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

export function defaultEnrollmentNoticeValidator(): EnrollmentNoticeValidator {
  return new EnrollmentNoticeValidator(
    [
      new EnrollmentNoticeVariantLengthRule(255),
      new EnrollmentNoticeVisibleGuardRule(3600),
      new EnrollmentNoticeCodeLengthRule(32),
      new EnrollmentNoticePriorityRangeRule(64, 86400),
      new EnrollmentNoticeCodePrefixRule("ACM"),
    ],
  );
}
