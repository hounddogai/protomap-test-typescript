import * as text from "../../../../kit/text.js";
import { RegionalBounceNotice } from "./regional-bounce-notice.js";

/** A rule a regional bounce notice must pass. Check returns its problems, or none. */
export interface RegionalBounceNoticeRule {
  check(item: RegionalBounceNotice): string[];
}

export class RegionalBounceNoticeCodeLengthRule implements RegionalBounceNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalBounceNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalBounceNoticeCodePrefixRule implements RegionalBounceNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalBounceNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalBounceNoticeCostRangeRule implements RegionalBounceNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalBounceNotice): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalBounceNoticeAllowedCodeRule implements RegionalBounceNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalBounceNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class RegionalBounceNoticeEndsAtRangeRule implements RegionalBounceNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalBounceNotice): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a regional bounce notice. */
export class RegionalBounceNoticeValidator {
  rules: RegionalBounceNoticeRule[];

  constructor(rules: RegionalBounceNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalBounceNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalBounceNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalBounceNotice[]): Map<string, string[]> {
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

export function defaultRegionalBounceNoticeValidator(): RegionalBounceNoticeValidator {
  return new RegionalBounceNoticeValidator(
    [
      new RegionalBounceNoticeCodeLengthRule(32),
      new RegionalBounceNoticeCodePrefixRule("REF"),
      new RegionalBounceNoticeCostRangeRule(0.2, 4849.2),
      new RegionalBounceNoticeAllowedCodeRule(["primary", "legacy"]),
      new RegionalBounceNoticeEndsAtRangeRule(32, 1000),
    ],
  );
}
