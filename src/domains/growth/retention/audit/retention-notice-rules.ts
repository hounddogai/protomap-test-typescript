import { RetentionNotice } from "./retention-notice.js";

/** A rule a retention notice must pass. Check returns its problems, or none. */
export interface RetentionNoticeRule {
  check(item: RetentionNotice): string[];
}

export class RetentionNoticeRequiredCodeRule implements RetentionNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionNoticeCodePrefixRule implements RetentionNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RetentionNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RetentionNoticeCostRangeRule implements RetentionNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionNotice): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionNoticeCreatedAtRangeRule implements RetentionNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionNotice): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RetentionNoticeCodeLengthRule implements RetentionNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a retention notice. */
export class RetentionNoticeValidator {
  rules: RetentionNoticeRule[];

  constructor(rules: RetentionNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionNotice[]): Map<string, string[]> {
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

export function defaultRetentionNoticeValidator(): RetentionNoticeValidator {
  return new RetentionNoticeValidator(
    [
      new RetentionNoticeRequiredCodeRule("retention notice needs an entry"),
      new RetentionNoticeCodePrefixRule("X"),
      new RetentionNoticeCostRangeRule(1.3, 1596.6),
      new RetentionNoticeCreatedAtRangeRule(32, 255),
      new RetentionNoticeCodeLengthRule(120),
    ],
  );
}
