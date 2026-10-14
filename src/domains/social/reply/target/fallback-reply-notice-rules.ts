import * as text from "../../../../kit/text.js";
import { FallbackReplyNotice } from "./fallback-reply-notice.js";

/** A rule a fallback reply notice must pass. Check returns its problems, or none. */
export interface FallbackReplyNoticeRule {
  check(item: FallbackReplyNotice): string[];
}

export class FallbackReplyNoticeCodePrefixRule implements FallbackReplyNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackReplyNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackReplyNoticeRequiredExternalRefRule implements FallbackReplyNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackReplyNotice): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackReplyNoticeSequenceRangeRule implements FallbackReplyNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackReplyNotice): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackReplyNoticeTitleLengthRule implements FallbackReplyNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackReplyNotice): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackReplyNoticeApprovedGuardRule implements FallbackReplyNoticeRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackReplyNotice): string[] {
    if (item.approved && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class FallbackReplyNoticeAllowedCodeRule implements FallbackReplyNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackReplyNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a fallback reply notice. */
export class FallbackReplyNoticeValidator {
  rules: FallbackReplyNoticeRule[];

  constructor(rules: FallbackReplyNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackReplyNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackReplyNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackReplyNotice[]): Map<string, string[]> {
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

export function defaultFallbackReplyNoticeValidator(): FallbackReplyNoticeValidator {
  return new FallbackReplyNoticeValidator(
    [
      new FallbackReplyNoticeCodePrefixRule("Q"),
      new FallbackReplyNoticeRequiredExternalRefRule("fallback reply notice needs an entry"),
      new FallbackReplyNoticeSequenceRangeRule(80, 1000),
      new FallbackReplyNoticeTitleLengthRule(86400),
      new FallbackReplyNoticeApprovedGuardRule(8.6),
      new FallbackReplyNoticeAllowedCodeRule(["default", "weighted"]),
    ],
  );
}
