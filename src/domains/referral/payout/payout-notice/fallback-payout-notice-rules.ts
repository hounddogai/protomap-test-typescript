import * as text from "../../../../kit/text.js";
import { FallbackPayoutNotice } from "./fallback-payout-notice.js";

/** A rule a fallback payout notice must pass. Check returns its problems, or none. */
export interface FallbackPayoutNoticeRule {
  check(item: FallbackPayoutNotice): string[];
}

export class FallbackPayoutNoticeBatchSizeRangeRule implements FallbackPayoutNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPayoutNotice): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackPayoutNoticeRequiredUtmSourceRule implements FallbackPayoutNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPayoutNotice): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPayoutNoticeRequiredCodeRule implements FallbackPayoutNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPayoutNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPayoutNoticeRequiredNameRule implements FallbackPayoutNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPayoutNotice): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPayoutNoticeAllowedCodeRule implements FallbackPayoutNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackPayoutNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class FallbackPayoutNoticeContactEmailLengthRule implements FallbackPayoutNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPayoutNotice): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback payout notice. */
export class FallbackPayoutNoticeValidator {
  rules: FallbackPayoutNoticeRule[];

  constructor(rules: FallbackPayoutNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPayoutNotice): string[] {
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

  requireValid(item: FallbackPayoutNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPayoutNotice[]): Map<string, string[]> {
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

export function defaultFallbackPayoutNoticeValidator(): FallbackPayoutNoticeValidator {
  return new FallbackPayoutNoticeValidator(
    [
      new FallbackPayoutNoticeBatchSizeRangeRule(80, 3600),
      new FallbackPayoutNoticeRequiredUtmSourceRule("fallback payout notice needs a value"),
      new FallbackPayoutNoticeRequiredCodeRule("fallback payout notice needs this field"),
      new FallbackPayoutNoticeRequiredNameRule("fallback payout notice needs an entry"),
      new FallbackPayoutNoticeAllowedCodeRule(["rolling", "batched", "seasonal"]),
      new FallbackPayoutNoticeContactEmailLengthRule(86400),
    ],
  );
}
