import * as text from "../../../../kit/text.js";
import { BidRuleQuota } from "./bid-rule-quota.js";

/** A rule a bid rule quota must pass. Check returns its problems, or none. */
export interface BidRuleQuotaRule {
  check(item: BidRuleQuota): string[];
}

export class BidRuleQuotaRequiredTitleRule implements BidRuleQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleQuotaAllowedTitleRule implements BidRuleQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BidRuleQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is not allowed`];
    return [];
  }
}

export class BidRuleQuotaRequiredAudienceIdRule implements BidRuleQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleQuota): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleQuotaCodePrefixRule implements BidRuleQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BidRuleQuotaImpressionsRangeRule implements BidRuleQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleQuota): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a bid rule quota. */
export class BidRuleQuotaValidator {
  rules: BidRuleQuotaRule[];

  constructor(rules: BidRuleQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleQuota[]): Map<string, string[]> {
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

export function defaultBidRuleQuotaValidator(): BidRuleQuotaValidator {
  return new BidRuleQuotaValidator(
    [
      new BidRuleQuotaRequiredTitleRule("bid rule quota needs an entry"),
      new BidRuleQuotaAllowedTitleRule(["manual", "strict"]),
      new BidRuleQuotaRequiredAudienceIdRule("bid rule quota needs a value"),
      new BidRuleQuotaCodePrefixRule("Q"),
      new BidRuleQuotaImpressionsRangeRule(255, 1000),
    ],
  );
}
