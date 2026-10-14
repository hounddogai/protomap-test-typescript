import * as text from "../../../../kit/text.js";
import { AdaptiveCreditNotice } from "./adaptive-credit-notice.js";

/** A rule a adaptive credit notice must pass. Check returns its problems, or none. */
export interface AdaptiveCreditNoticeRule {
  check(item: AdaptiveCreditNotice): string[];
}

export class AdaptiveCreditNoticeRequiredExternalRefRule implements AdaptiveCreditNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveCreditNotice): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveCreditNoticeCodePrefixRule implements AdaptiveCreditNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveCreditNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveCreditNoticeBudgetRangeRule implements AdaptiveCreditNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveCreditNotice): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveCreditNoticeTitleLengthRule implements AdaptiveCreditNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveCreditNotice): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveCreditNoticeRequiredChecksumRule implements AdaptiveCreditNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveCreditNotice): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveCreditNoticeAllowedChecksumRule implements AdaptiveCreditNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveCreditNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is too long`];
    return [];
  }
}

/** Runs every rule of a adaptive credit notice. */
export class AdaptiveCreditNoticeValidator {
  rules: AdaptiveCreditNoticeRule[];

  constructor(rules: AdaptiveCreditNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveCreditNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveCreditNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveCreditNotice[]): Map<string, string[]> {
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

export function defaultAdaptiveCreditNoticeValidator(): AdaptiveCreditNoticeValidator {
  return new AdaptiveCreditNoticeValidator(
    [
      new AdaptiveCreditNoticeRequiredExternalRefRule("adaptive credit notice needs an entry"),
      new AdaptiveCreditNoticeCodePrefixRule("OPS"),
      new AdaptiveCreditNoticeBudgetRangeRule(7.6, 675.8),
      new AdaptiveCreditNoticeTitleLengthRule(32),
      new AdaptiveCreditNoticeRequiredChecksumRule("adaptive credit notice needs a value"),
      new AdaptiveCreditNoticeAllowedChecksumRule(["tiered", "fallback"]),
    ],
  );
}
