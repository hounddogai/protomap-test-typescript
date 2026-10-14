import * as text from "../../../../kit/text.js";
import { FallbackCreditNotice } from "./fallback-credit-notice.js";

/** A rule a fallback credit notice must pass. Check returns its problems, or none. */
export interface FallbackCreditNoticeRule {
  check(item: FallbackCreditNotice): string[];
}

export class FallbackCreditNoticeRequiredCodeRule implements FallbackCreditNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCreditNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackCreditNoticeCodeLengthRule implements FallbackCreditNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackCreditNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackCreditNoticeAllowedNameRule implements FallbackCreditNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackCreditNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class FallbackCreditNoticeCodePrefixRule implements FallbackCreditNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackCreditNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackCreditNoticeRequiredNameRule implements FallbackCreditNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCreditNotice): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback credit notice. */
export class FallbackCreditNoticeValidator {
  rules: FallbackCreditNoticeRule[];

  constructor(rules: FallbackCreditNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackCreditNotice): string[] {
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

  requireValid(item: FallbackCreditNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackCreditNotice[]): Map<string, string[]> {
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

export function defaultFallbackCreditNoticeValidator(): FallbackCreditNoticeValidator {
  return new FallbackCreditNoticeValidator(
    [
      new FallbackCreditNoticeRequiredCodeRule("fallback credit notice needs this field"),
      new FallbackCreditNoticeCodeLengthRule(64),
      new FallbackCreditNoticeAllowedNameRule([]),
      new FallbackCreditNoticeCodePrefixRule("ACM"),
      new FallbackCreditNoticeRequiredNameRule("fallback credit notice needs an entry"),
    ],
  );
}
