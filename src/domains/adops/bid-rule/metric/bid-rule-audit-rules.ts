import * as text from "../../../../kit/text.js";
import { BidRuleAudit } from "./bid-rule-audit.js";

/** A rule a bid rule audit must pass. Check returns its problems, or none. */
export interface BidRuleAuditRule {
  check(item: BidRuleAudit): string[];
}

export class BidRuleAuditConversionRateRangeRule implements BidRuleAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleAudit): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BidRuleAuditRegionLengthRule implements BidRuleAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleAudit): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleAuditCodePrefixRule implements BidRuleAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BidRuleAuditTitleLengthRule implements BidRuleAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleAudit): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleAuditApprovedGuardRule implements BidRuleAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BidRuleAudit): string[] {
    if (item.approved && item.conversionRate > this.limit) return [`conversion rate ${item.conversionRate} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class BidRuleAuditAllowedTitleRule implements BidRuleAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BidRuleAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

/** Runs every rule of a bid rule audit. */
export class BidRuleAuditValidator {
  rules: BidRuleAuditRule[];

  constructor(rules: BidRuleAuditRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleAudit[]): Map<string, string[]> {
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

export function defaultBidRuleAuditValidator(): BidRuleAuditValidator {
  return new BidRuleAuditValidator(
    [
      new BidRuleAuditConversionRateRangeRule(6.8, 1595.1),
      new BidRuleAuditRegionLengthRule(255),
      new BidRuleAuditCodePrefixRule("OPS"),
      new BidRuleAuditTitleLengthRule(64),
      new BidRuleAuditApprovedGuardRule(3.4),
      new BidRuleAuditAllowedTitleRule([]),
    ],
  );
}
