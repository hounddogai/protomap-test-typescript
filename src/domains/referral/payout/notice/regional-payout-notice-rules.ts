import * as text from "../../../../kit/text.js";
import { RegionalPayoutNotice } from "./regional-payout-notice.js";

/** A rule a regional payout notice must pass. Check returns its problems, or none. */
export interface RegionalPayoutNoticeRule {
  check(item: RegionalPayoutNotice): string[];
}

export class RegionalPayoutNoticeMinimumRangeRule implements RegionalPayoutNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPayoutNotice): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalPayoutNoticeAllowedCodeRule implements RegionalPayoutNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalPayoutNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class RegionalPayoutNoticeCodePrefixRule implements RegionalPayoutNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalPayoutNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalPayoutNoticeImpressionsRangeRule implements RegionalPayoutNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPayoutNotice): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalPayoutNoticeUnitLengthRule implements RegionalPayoutNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPayoutNotice): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPayoutNoticeRequiredCodeRule implements RegionalPayoutNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPayoutNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional payout notice. */
export class RegionalPayoutNoticeValidator {
  rules: RegionalPayoutNoticeRule[];

  constructor(rules: RegionalPayoutNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPayoutNotice): string[] {
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

  requireValid(item: RegionalPayoutNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPayoutNotice[]): Map<string, string[]> {
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

export function defaultRegionalPayoutNoticeValidator(): RegionalPayoutNoticeValidator {
  return new RegionalPayoutNoticeValidator(
    [
      new RegionalPayoutNoticeMinimumRangeRule(7.3, 2983.9),
      new RegionalPayoutNoticeAllowedCodeRule(["default", "rolling", "batched"]),
      new RegionalPayoutNoticeCodePrefixRule("Q"),
      new RegionalPayoutNoticeImpressionsRangeRule(64, 86400),
      new RegionalPayoutNoticeUnitLengthRule(86400),
      new RegionalPayoutNoticeRequiredCodeRule("regional payout notice needs this field"),
    ],
  );
}
