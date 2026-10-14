import * as text from "../../../../kit/text.js";
import { BidRuleOverride } from "./bid-rule-override.js";

/** A rule a bid rule override must pass. Check returns its problems, or none. */
export interface BidRuleOverrideRule {
  check(item: BidRuleOverride): string[];
}

export class BidRuleOverrideBidRangeRule implements BidRuleOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleOverride): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BidRuleOverrideLabelLengthRule implements BidRuleOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleOverride): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleOverrideDescriptionLengthRule implements BidRuleOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleOverride): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleOverridePinnedGuardRule implements BidRuleOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BidRuleOverride): string[] {
    if (item.pinned && item.sendAt > this.limit) return [`send at ${item.sendAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class BidRuleOverrideConversionRateRangeRule implements BidRuleOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleOverride): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BidRuleOverrideAllowedCodeRule implements BidRuleOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BidRuleOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

/** Runs every rule of a bid rule override. */
export class BidRuleOverrideValidator {
  rules: BidRuleOverrideRule[];

  constructor(rules: BidRuleOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleOverride): string[] {
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

  requireValid(item: BidRuleOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleOverride[]): Map<string, string[]> {
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

export function defaultBidRuleOverrideValidator(): BidRuleOverrideValidator {
  return new BidRuleOverrideValidator(
    [
      new BidRuleOverrideBidRangeRule(5.2, 1068.4),
      new BidRuleOverrideLabelLengthRule(86400),
      new BidRuleOverrideDescriptionLengthRule(3600),
      new BidRuleOverridePinnedGuardRule(80),
      new BidRuleOverrideConversionRateRangeRule(2.2, 288.4),
      new BidRuleOverrideAllowedCodeRule(["weighted", "adaptive", "capped"]),
    ],
  );
}
