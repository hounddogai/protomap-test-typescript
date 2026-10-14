import * as text from "../../../../kit/text.js";
import { FallbackTierNotice } from "./fallback-tier-notice.js";

/** A rule a fallback tier notice must pass. Check returns its problems, or none. */
export interface FallbackTierNoticeRule {
  check(item: FallbackTierNotice): string[];
}

export class FallbackTierNoticeTitleLengthRule implements FallbackTierNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackTierNotice): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackTierNoticeCodePrefixRule implements FallbackTierNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackTierNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackTierNoticeAllowedLocaleRule implements FallbackTierNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackTierNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is duplicated`];
    return [];
  }
}

export class FallbackTierNoticeRequiredSourceRule implements FallbackTierNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackTierNotice): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback tier notice. */
export class FallbackTierNoticeValidator {
  rules: FallbackTierNoticeRule[];

  constructor(rules: FallbackTierNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackTierNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackTierNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackTierNotice[]): Map<string, string[]> {
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

export function defaultFallbackTierNoticeValidator(): FallbackTierNoticeValidator {
  return new FallbackTierNoticeValidator(
    [
      new FallbackTierNoticeTitleLengthRule(255),
      new FallbackTierNoticeCodePrefixRule("X"),
      new FallbackTierNoticeAllowedLocaleRule([]),
      new FallbackTierNoticeRequiredSourceRule("fallback tier notice needs a value"),
    ],
  );
}
