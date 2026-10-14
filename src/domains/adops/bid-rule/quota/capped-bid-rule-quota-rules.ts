import * as text from "../../../../kit/text.js";
import { CappedBidRuleQuota } from "./capped-bid-rule-quota.js";

/** A rule a capped bid rule quota must pass. Check returns its problems, or none. */
export interface CappedBidRuleQuotaRule {
  check(item: CappedBidRuleQuota): string[];
}

export class CappedBidRuleQuotaRequiredTitleRule implements CappedBidRuleQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedBidRuleQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedBidRuleQuotaCodePrefixRule implements CappedBidRuleQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedBidRuleQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedBidRuleQuotaRequiredDescriptionRule implements CappedBidRuleQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedBidRuleQuota): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class CappedBidRuleQuotaDescriptionLengthRule implements CappedBidRuleQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedBidRuleQuota): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedBidRuleQuotaGraceDaysRangeRule implements CappedBidRuleQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedBidRuleQuota): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedBidRuleQuotaAllowedCodeRule implements CappedBidRuleQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedBidRuleQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

/** Runs every rule of a capped bid rule quota. */
export class CappedBidRuleQuotaValidator {
  rules: CappedBidRuleQuotaRule[];

  constructor(rules: CappedBidRuleQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: CappedBidRuleQuota): string[] {
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

  requireValid(item: CappedBidRuleQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedBidRuleQuota[]): Map<string, string[]> {
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

export function defaultCappedBidRuleQuotaValidator(): CappedBidRuleQuotaValidator {
  return new CappedBidRuleQuotaValidator(
    [
      new CappedBidRuleQuotaRequiredTitleRule("capped bid rule quota needs this field"),
      new CappedBidRuleQuotaCodePrefixRule("REF"),
      new CappedBidRuleQuotaRequiredDescriptionRule("capped bid rule quota needs a value"),
      new CappedBidRuleQuotaDescriptionLengthRule(16),
      new CappedBidRuleQuotaGraceDaysRangeRule(255, 3600),
      new CappedBidRuleQuotaAllowedCodeRule(["legacy"]),
    ],
  );
}
