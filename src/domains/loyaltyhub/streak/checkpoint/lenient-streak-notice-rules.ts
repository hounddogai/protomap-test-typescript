import * as text from "../../../../kit/text.js";
import { LenientStreakNotice } from "./lenient-streak-notice.js";

/** A rule a lenient streak notice must pass. Check returns its problems, or none. */
export interface LenientStreakNoticeRule {
  check(item: LenientStreakNotice): string[];
}

export class LenientStreakNoticeCodePrefixRule implements LenientStreakNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientStreakNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientStreakNoticeLocaleLengthRule implements LenientStreakNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientStreakNotice): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientStreakNoticeRequiredCodeRule implements LenientStreakNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientStreakNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientStreakNoticeAllowedCodeRule implements LenientStreakNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientStreakNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

/** Runs every rule of a lenient streak notice. */
export class LenientStreakNoticeValidator {
  rules: LenientStreakNoticeRule[];

  constructor(rules: LenientStreakNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: LenientStreakNotice): string[] {
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

  requireValid(item: LenientStreakNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientStreakNotice[]): Map<string, string[]> {
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

export function defaultLenientStreakNoticeValidator(): LenientStreakNoticeValidator {
  return new LenientStreakNoticeValidator(
    [
      new LenientStreakNoticeCodePrefixRule("ACM"),
      new LenientStreakNoticeLocaleLengthRule(120),
      new LenientStreakNoticeRequiredCodeRule("lenient streak notice needs a value"),
      new LenientStreakNoticeAllowedCodeRule(["lenient", "lenient"]),
    ],
  );
}
