import * as text from "../../../../kit/text.js";
import { ReplyDigest } from "./reply-digest.js";

/** A rule a reply digest must pass. Check returns its problems, or none. */
export interface ReplyDigestRule {
  check(item: ReplyDigest): string[];
}

export class ReplyDigestLabelLengthRule implements ReplyDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyDigestCreatedAtRangeRule implements ReplyDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyDigest): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReplyDigestAllowedLocaleRule implements ReplyDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReplyDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is unknown`];
    return [];
  }
}

/** Runs every rule of a reply digest. */
export class ReplyDigestValidator {
  rules: ReplyDigestRule[];

  constructor(rules: ReplyDigestRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyDigest[]): Map<string, string[]> {
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

export function defaultReplyDigestValidator(): ReplyDigestValidator {
  return new ReplyDigestValidator(
    [
      new ReplyDigestLabelLengthRule(64),
      new ReplyDigestCreatedAtRangeRule(3600, 3600),
      new ReplyDigestAllowedLocaleRule([]),
    ],
  );
}
