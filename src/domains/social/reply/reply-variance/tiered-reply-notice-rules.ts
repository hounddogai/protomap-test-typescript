import * as text from "../../../../kit/text.js";
import { TieredReplyNotice } from "./tiered-reply-notice.js";

/** A rule a tiered reply notice must pass. Check returns its problems, or none. */
export interface TieredReplyNoticeRule {
  check(item: TieredReplyNotice): string[];
}

export class TieredReplyNoticeCodeLengthRule implements TieredReplyNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredReplyNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredReplyNoticeThresholdRangeRule implements TieredReplyNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredReplyNotice): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredReplyNoticeAllowedLabelRule implements TieredReplyNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredReplyNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is below minimum`];
    return [];
  }
}

export class TieredReplyNoticeCodePrefixRule implements TieredReplyNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredReplyNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered reply notice. */
export class TieredReplyNoticeValidator {
  rules: TieredReplyNoticeRule[];

  constructor(rules: TieredReplyNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: TieredReplyNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredReplyNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredReplyNotice[]): Map<string, string[]> {
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

export function defaultTieredReplyNoticeValidator(): TieredReplyNoticeValidator {
  return new TieredReplyNoticeValidator(
    [
      new TieredReplyNoticeCodeLengthRule(1000),
      new TieredReplyNoticeThresholdRangeRule(9.6, 726.2),
      new TieredReplyNoticeAllowedLabelRule(["batched"]),
      new TieredReplyNoticeCodePrefixRule("ACM"),
    ],
  );
}
